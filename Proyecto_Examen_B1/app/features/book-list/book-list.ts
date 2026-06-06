import { EventData, Page, Observable, ObservableArray, Utils, Frame } from '@nativescript/core';
import { BookRepository } from '../../core/data/book-repository';

declare var android: any;

/**
 * Inicializa el ViewModel de la lista al navegar a esta pantalla.
 * Usa la ruta actualizada con estructura core/features tras refactorización.
 */
export function onNavigatingTo(args: EventData) {
    const page = <Page>args.object;
    let viewModel = page.bindingContext;

    // Solo inicializa el ViewModel una vez; en navegaciones posteriores solo recarga datos
    if (!viewModel) {
        viewModel = new Observable();
        viewModel.set("useSql", true); // Motor SQL activo por defecto
        viewModel.set("books", new ObservableArray<any>());

        viewModel.set("onAddBook", () => {
            console.log("Navegando a book-form...");
            Frame.topmost().navigate("features/book-form/book-form");
        });

        page.bindingContext = viewModel;
    }

    // Recarga la lista cada vez que se vuelve a esta pantalla (ej: tras guardar un libro)
    loadBooks(page);
}

/**
 * Handler del Switch SQL/NoSQL en la UI.
 * El setTimeout(10ms) garantiza que el estado del switch se refleje
 * en la UI antes de recargar la lista.
 */
export function onSwitchMode(args: any) {
    const page = args.object.page;
    const isChecked = args.object.checked;
    const viewModel = page.bindingContext;
    if(viewModel) {
        setTimeout(() => {
            viewModel.set("useSql", isChecked);
            const repo = BookRepository.getInstance();
            repo.setMode(isChecked);   // Conmuta el motor en el repositorio central
            loadBooks(page);           // Recarga los datos desde el nuevo motor
        }, 10);
    }
}

/** Obtiene los libros del repositorio activo y los carga en el ObservableArray */
async function loadBooks(page: Page) {
    const viewModel = page.bindingContext;
    const repo = BookRepository.getInstance();
    const books = await repo.getBooks();

    const booksArray = viewModel.get("books") as ObservableArray<any>;
    // Limpia el array observable para forzar re-render completo de la lista
    booksArray.splice(0, booksArray.length);

    // Extiende cada libro con sus handlers de acción (editar y eliminar)
    const booksWithLogic = books.map(book => {
        return {
            ...book,

            /** Navega al formulario pasando el libro como contexto (modo edición) */
            onItemAction: () => {
                const vm = page.bindingContext;
                if (vm && vm.get && vm.get("suppressItemTap")) {
                    // Se produjo un tap en el botón Borrar justo antes;
                    // suprime la navegación al formulario.
                    vm.set("suppressItemTap", false);
                    return;
                }

                Frame.topmost().navigate({
                    moduleName: "features/book-form/book-form",
                    context: book
                });
            },

            /** Muestra un AlertDialog nativo de Android para confirmar la eliminación */
            onDeleteAction: (args: any) => {
                // Marca temporalmente para suprimir la navegación del item
                // cuando se pulsa el botón Borrar (evita que el padre navegue).
                try {
                    const vm = page.bindingContext;
                    if (vm && vm.set) {
                        vm.set("suppressItemTap", true);
                        setTimeout(() => { try { vm.set("suppressItemTap", false); } catch (e) { /* ignore */ } }, 600);
                    }
                } catch (e) {}

                const activity = Utils.android.getCurrentActivity();

                if (activity) {
                    const builder = new android.app.AlertDialog.Builder(activity);
                    builder.setTitle("Confirmar eliminación");
                    builder.setMessage(`¿Estás seguro de que deseas eliminar "${book.title}"?`);

                    // Botón positivo: elimina el libro y recarga la lista
                    builder.setPositiveButton("Eliminar", new android.content.DialogInterface.OnClickListener({
                        onClick: async (dialog: any, id: number) => {
                            await repo.deleteBook(book.id);
                            loadBooks(page);
                            android.widget.Toast.makeText(activity, "Libro eliminado", android.widget.Toast.LENGTH_SHORT).show();
                        }
                    }));

                    // Botón negativo: cierra el diálogo sin acción
                    builder.setNegativeButton("Cancelar", null);

                    const alertDialog = builder.create();

                    // Personaliza colores de botones tras el show() porque el dialog
                    // no tiene botones accesibles hasta que está visible en pantalla
                    alertDialog.setOnShowListener(new android.content.DialogInterface.OnShowListener({
                        onShow: (dialog: any) => {
                            setTimeout(() => {
                                const purpleColor = android.graphics.Color.parseColor("#6750A4"); // M3 Primary
                                const grayColor = android.graphics.Color.parseColor("#757575");
                                const posBtn = alertDialog.getButton(android.content.DialogInterface.BUTTON_POSITIVE);
                                const negBtn = alertDialog.getButton(android.content.DialogInterface.BUTTON_NEGATIVE);
                                if (posBtn) { posBtn.setTextColor(purpleColor); posBtn.setAllCaps(false); }
                                if (negBtn) { negBtn.setTextColor(grayColor); negBtn.setAllCaps(false); }
                            }, 10);
                        }
                    }));

                    alertDialog.show();
                }
            }
        };
    });

    booksArray.push(...booksWithLogic);
}

/** Navega al formulario en modo creación (sin contexto = libro nuevo) */
export function onAddBook() {
    Frame.topmost().navigate("features/book-form/book-form");
}

/** Navega a la pantalla de conectividad REST (Módulo 1 del proyecto) */
export function onNavigateToRest() {
    Frame.topmost().navigate("core/rest-api/rest-api");
}

/** Navega a la pantalla de almacenamiento seguro (Módulo 3 del proyecto) */
export function onNavigateToSecurity() {
    Frame.topmost().navigate("core/security/security");
}
