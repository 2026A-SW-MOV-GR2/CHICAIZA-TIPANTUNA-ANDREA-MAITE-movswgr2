import { EventData, Page, Observable, Frame, Utils, knownFolders, profile } from '@nativescript/core';

declare var android: any;
declare var androidx: any;

/** Inicializa el ViewModel al navegar a la pantalla de seguridad */
export function onNavigatingTo(args: EventData) {
    const page = <Page>args.object;

    if (!page.bindingContext) {
        const vm = new Observable();

        // Campos de entrada para la llave y el valor del secreto
        vm.set("secretKey", "");
        vm.set("secretValue", "");

        // Opciones del selector de mecanismo de persistencia
        vm.set("mechanisms", ["SharedPreferences (Plano)", "DataStore (File Async)", "EncryptedSharedPreferences"]);
        vm.set("selectedMechanismIndex", 0);

        /** Guarda el par llave-valor en el mecanismo seleccionado */
        vm.set("onSave", async () => {
            const key = vm.get("secretKey");
            const val = vm.get("secretValue");
            const index = vm.get("selectedMechanismIndex");

            if (!key || !val) {
                showToast("Ingrese Llave y Valor");
                return;
            }

            try {
                // Despacha al mecanismo según el índice del selector
                if (index === 0) {
                    saveToSharedPreferences(key, val);        // Plano, síncrono
                } else if (index === 1) {
                    await saveToDataStoreMock(key, val);      // Archivo JSON, asíncrono
                } else {
                    saveToEncryptedPrefs(key, val);           // AES-256 cifrado
                }
                showToast(`Guardado en ${vm.get("mechanisms")[index]}`);
            } catch (error) {
                console.error(error);
                showToast("Error al guardar");
            }
        });

        /** Recupera el valor de la llave ingresada desde el mecanismo seleccionado */
        vm.set("onRetrieve", async () => {
            const key = vm.get("secretKey");
            const index = vm.get("selectedMechanismIndex");

            if (!key) {
                showToast("Ingrese la Llave");
                return;
            }

            try {
                let val = null;
                if (index === 0) {
                    val = getFromSharedPreferences(key);
                } else if (index === 1) {
                    val = await getFromDataStoreMock(key);
                } else {
                    val = getFromEncryptedPrefs(key);
                }

                if (val !== null) {
                    vm.set("secretValue", val);
                    showToast(`Recuperado: ${val}`);
                } else {
                    vm.set("secretValue", "");
                    showToast("No se encontró el secreto");
                }
            } catch (error) {
                console.error(error);
                showToast("Error al recuperar secreto");
            }
        });

        page.bindingContext = vm;
    }
}

/** Regresa a la pantalla anterior */
export function onBack() {
    Frame.topmost().goBack();
}

/** Muestra un Toast nativo de Android */
function showToast(message: string) {
    const context = Utils.android.getApplicationContext();
    android.widget.Toast.makeText(context, message, android.widget.Toast.LENGTH_SHORT).show();
}

// ─── Mecanismo 1: SharedPreferences (texto plano) ────────────────────────────

/** Guarda un valor en SharedPreferences sin cifrado */
function saveToSharedPreferences(key: string, value: string) {
    const context = Utils.android.getApplicationContext();
    const prefs = context.getSharedPreferences("app_plano_prefs", android.content.Context.MODE_PRIVATE);
    const editor = prefs.edit();
    editor.putString(key, value);
    editor.apply(); // Escritura asíncrona en background, no bloquea el hilo principal
}

/** Lee un valor de SharedPreferences; retorna null si no existe */
function getFromSharedPreferences(key: string): string | null {
    const context = Utils.android.getApplicationContext();
    const prefs = context.getSharedPreferences("app_plano_prefs", android.content.Context.MODE_PRIVATE);
    return prefs.getString(key, null as unknown as string);
}

// ─── Mecanismo 2: DataStore Mock (archivo JSON asíncrono) ─────────────────────

/** Simula DataStore escribiendo en un archivo JSON en el directorio de documentos */
async function saveToDataStoreMock(key: string, value: string) {
    const file = knownFolders.documents().getFile("datastore_mock.json");
    let data: any = {};
    try {
        const content = await file.readText();
        data = content ? JSON.parse(content) : {};
    } catch(e) {} // Si el archivo no existe aún, empieza con objeto vacío
    data[key] = value;
    await file.writeText(JSON.stringify(data));
}

/** Lee el valor de la llave desde el archivo JSON mock de DataStore */
async function getFromDataStoreMock(key: string): Promise<string | null> {
    const file = knownFolders.documents().getFile("datastore_mock.json");
    try {
        const content = await file.readText();
        if (content) {
            const data = JSON.parse(content);
            return data[key] || null;
        }
    } catch(e) {}
    return null;
}

// ─── Mecanismo 3: EncryptedSharedPreferences (AES-256) ───────────────────────

/**
 * Construye la instancia de EncryptedSharedPreferences usando AndroidX Security.
 * Cifra llaves con AES-256 SIV y valores con AES-128 GCM.
 */
function getEncryptedPrefs() {
    const context = Utils.android.getApplicationContext();
    try {
        // MasterKey maneja el keystore de Android; AES256_GCM es el esquema recomendado
        const masterKey = new androidx.security.crypto.MasterKey.Builder(context)
            .setKeyScheme(androidx.security.crypto.MasterKey.KeyScheme.AES256_GCM)
            .build();

        return androidx.security.crypto.EncryptedSharedPreferences.create(
            context,
            "secret_encrypted_prefs",
            masterKey,
            androidx.security.crypto.EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            androidx.security.crypto.EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        );
    } catch (error) {
        console.error("EncryptedPrefs Error:", error);
        throw error;
    }
}

/** Guarda un valor cifrado en EncryptedSharedPreferences */
function saveToEncryptedPrefs(key: string, value: string) {
    const prefs = getEncryptedPrefs();
    const editor = prefs.edit();
    editor.putString(key, value);
    editor.apply();
}

/** Lee y descifra un valor desde EncryptedSharedPreferences */
function getFromEncryptedPrefs(key: string): string | null {
    const prefs = getEncryptedPrefs();
    return prefs.getString(key, null);
}