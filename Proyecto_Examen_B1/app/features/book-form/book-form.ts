import { EventData, Page, Observable, Frame, Utils, TextField, Application, AndroidApplication, AndroidActivityResultEventData, knownFolders} from '@nativescript/core';
import { BookRepository } from '../../core/data/book-repository';

declare var android: any;

/**
 * Inicializa el formulario al navegar.
 * Si llega con navigationContext, opera en modo EDICIÓN; si no, en modo CREACIÓN.
 */
export function onNavigatingTo(args: EventData) {
    const page = <Page>args.object;
    const context = page.navigationContext; // Libro existente si es edición, null si es nuevo

    // El ViewModel y sus handlers solo se crean una vez
    if (!page.bindingContext) {
        const vm = new Observable();
        const repo = BookRepository.getInstance();

        vm.set("categories", ["Ficción", "Drama", "Tecnología", "Historia", "Biografía"]);
        vm.set("useSql", repo.isUsingSql()); // Refleja el motor activo actual

        /** Actualiza el estado de lectura desde los botones del XML */
        vm.set("setStatus", (args: any) => {
            vm.set("status", args.object.data);
        });

        /**
         * Listener de resultado para el selector de imágenes nativo.
         * requestCode 100 identifica esta solicitud específica de imagen.
         * Se des-registra después de recibir el resultado para evitar listeners duplicados.
         */
        const onActivityResult = (args: AndroidActivityResultEventData) => {
            if (args.requestCode === 100 && args.resultCode === android.app.Activity.RESULT_OK) {
                if (args.intent && args.intent.getData()) {
                    const uri = args.intent.getData();
                    
                    // Convierte content:// URI a ruta absoluta legible por NativeScript
                    const context = Utils.android.getApplicationContext();
                    const contentResolver = context.getContentResolver();
                    const inputStream = contentResolver.openInputStream(uri);
                    
                    const file = knownFolders.temp().getFile(`cover_${Date.now()}.jpg`);
                    const outputStream = new java.io.FileOutputStream(file.path);
                    
                    const buffer = Array.create('byte', 4096);
                    let bytesRead;
                    while ((bytesRead = inputStream.read(buffer)) !== -1) {
                        outputStream.write(buffer, 0, bytesRead);
                    }
                    outputStream.close();
                    inputStream.close();
                    
                    vm.set("previewImage", file.path); // Ruta absoluta, NativeScript la lee sin problema
                }
            }
            Application.android.off(AndroidApplication.activityResultEvent, onActivityResult);
        };

        /** Abre el selector de archivos nativo de Android filtrado a imágenes */
        vm.set("onSelectImage", () => {
            const intent = new android.content.Intent(android.content.Intent.ACTION_GET_CONTENT);
            intent.setType("image/*");
            const activity = Utils.android.getCurrentActivity();
            if (!activity) {
                return;
            }
            Application.android.on(AndroidApplication.activityResultEvent, onActivityResult);
            activity.startActivityForResult(intent, 100); // 100 = código de solicitud personalizado
        });

        /**
         * DatePickerDialog nativo de Android sin plugins externos.
         * Inicializa con la fecha actual usando java.util.Calendar.
         * Recibe un callback para aplicar la fecha formateada al campo correspondiente.
         */
        const showNativeDatePicker = (callback: (formattedDate: string) => void) => {
            const calendar = java.util.Calendar.getInstance();
            const activity = Utils.android.getCurrentActivity();

            const datePicker = new android.app.DatePickerDialog(
                activity,
                new android.app.DatePickerDialog.OnDateSetListener({
                    onDateSet: (view: any, year: number, month: number, day: number) => {
                        // month es 0-indexado en Java, se suma 1 para display
                        const formattedDate = `${day}/${month + 1}/${year}`;
                        callback(formattedDate);
                    }
                }),
                calendar.get(java.util.Calendar.YEAR),
                calendar.get(java.util.Calendar.MONTH),
                calendar.get(java.util.Calendar.DAY_OF_MONTH)
            );

            datePicker.show();

            // Los botones solo son accesibles después del show(); se colorean aquí
            const purpleColor = android.graphics.Color.parseColor("#6750A4"); // M3 Primary
            const okButton = datePicker.getButton(android.content.DialogInterface.BUTTON_POSITIVE);
            const cancelButton = datePicker.getButton(android.content.DialogInterface.BUTTON_NEGATIVE);
            if (okButton) okButton.setTextColor(purpleColor);
            if (cancelButton) cancelButton.setTextColor(purpleColor);
        };

        // Conecta los botones del XML con el date picker nativo
        vm.set("onPickStartDate", () => {
            showNativeDatePicker((date) => vm.set("startDateText", date));
        });
        vm.set("onPickEndDate", () => {
            showNativeDatePicker((date) => vm.set("endDateText", date));
        });

        page.bindingContext = vm;
    }

    // Estos campos se actualizan en cada navegación para soportar edición correcta
    const vm = page.bindingContext as Observable;
    vm.set("id", context ? context.id : null);         // null = modo creación
    vm.set("title", context ? context.title : "");
    vm.set("author", context ? context.author : "");
    vm.set("isFavorite", context ? context.isFavorite : false);
    vm.set("status", context ? context.status : "Pendiente"); // Estado por defecto
    vm.set("previewImage", context && context.image ? context.image : "https://placehold.co/150x150/E8DEF8/6750A4/png");
    vm.set("startDateText", context && context.startDate ? context.startDate : "Seleccionar fecha");
    vm.set("endDateText", context && context.endDate ? context.endDate : "Seleccionar fecha");
}

/** Regresa sin guardar cambios */
export function onBack() {
    Frame.topmost().goBack();
}

/**
 * Handler del Switch SQL/NoSQL en el formulario.
 * Conmuta el motor del repositorio global, afectando también a book-list.
 */
export function onSwitchMode(args: any) {
    const page = args.object.page;
    const isChecked = args.object.checked;
    const viewModel = page.bindingContext;
    if(viewModel) {
        setTimeout(() => {
            viewModel.set("useSql", isChecked);
            const repo = BookRepository.getInstance();
            repo.setMode(isChecked);
        }, 10);
    }
}

/**
 * Guarda o actualiza el libro según si existe id.
 * Usa valores por defecto si title o author están vacíos.
 */
export async function onSave(args: EventData) {
    const view = args.object as any;
    const page = view.page;
    const vm = page.bindingContext;

    const id = vm.get("id");
    const title = vm.get("title") || "Nuevo Libro";
    const author = vm.get("author") || "Autor Desconocido";
    const status = vm.get("status");
    const image = vm.get("previewImage");

    const repo = BookRepository.getInstance();

    // id presente = actualización; id null = inserción nueva
    if (id) {
        await repo.updateBook(id, { title, author, status, image });
    } else {
        await repo.addBook({ title, author, status, image });
    }

    // Toast nativo de confirmación
    const context = Utils.android.getApplicationContext();
    android.widget.Toast.makeText(
        context,
        id ? "Libro actualizado con éxito" : "Libro guardado con éxito",
        android.widget.Toast.LENGTH_SHORT
    ).show();

    Frame.topmost().goBack(); // Regresa a la lista tras guardar
}