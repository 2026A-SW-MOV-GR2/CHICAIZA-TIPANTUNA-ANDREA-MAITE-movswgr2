import { EventData, Page, Observable, Frame, Http, Utils } from '@nativescript/core';

declare var android: any;

/** Inicializa el ViewModel al navegar a la pantalla REST API */
export function onNavigatingTo(args: EventData) {
    const page = <Page>args.object;

    // Evita reinicializar el ViewModel si la página ya tiene uno (ej: volver atrás)
    if (!page.bindingContext) {
        const vm = new Observable();

        // Estado inicial de los campos y flags de carga
        vm.set("searchId", "");
        vm.set("isLoading", false);
        vm.set("postLoaded", false);
        vm.set("title", "");
        vm.set("body", "");
        vm.set("responseJson", "");

        /** GET /posts/{id}: consulta un post por id y carga title/body en la UI */
        vm.set("onGetPost", async () => {
            const id = vm.get("searchId");
            if (!id) return;

            vm.set("isLoading", true);
            vm.set("postLoaded", false);

            try {
                const response = await Http.request({
                    url: `https://jsonplaceholder.typicode.com/posts/${id}`,
                    method: "GET"
                });

                if (response.statusCode === 200) {
                    const data = response.content ? response.content.toJSON() : null;
                    if (!data) {
                        showToast("Respuesta vacía");
                        return;
                    }
                    vm.set("title", data.title);
                    vm.set("body", data.body);
                    vm.set("responseJson", "");
                    vm.set("postLoaded", true);
                } else {
                    showToast("No se encontró el post");
                }
            } catch (error) {
                console.error(error);
                showToast("Error de red");
            } finally {
                // Siempre desactiva el loading, haya error o no
                vm.set("isLoading", false);
            }
        });

        /** PUT /posts/{id}: envía los datos editados y muestra la respuesta JSON */
        vm.set("onUpdatePost", async () => {
            const id = vm.get("searchId");
            const title = vm.get("title");
            const body = vm.get("body");

            // Requiere los tres campos para ejecutar la petición
            if (!id || !title || !body) return;

            vm.set("isLoading", true);
            vm.set("responseJson", "");

            try {
                const response = await Http.request({
                    url: `https://jsonplaceholder.typicode.com/posts/${id}`,
                    method: "PUT",
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    },
                    content: JSON.stringify({
                        id,
                        title,
                        body,
                        userId: 1 // JSONPlaceholder requiere este campo en el body
                    })
                });

                if (response.statusCode === 200 || response.statusCode === 201) {
                    const statusCode = response.statusCode;
                    const data = response.content ? response.content.toJSON() : null;
                    if (!data) {
                        showToast("Respuesta vacía");
                        return;
                    }
                    // Muestra el JSON de respuesta formateado para inspección
                    vm.set("responseJson", JSON.stringify(data, null, 2));
                    showToast(`Éxito: código ${statusCode} OK`);
                } else {
                    showToast("Error al actualizar");
                }
            } catch (error) {
                console.error(error);
                showToast("Error de red");
            } finally {
                vm.set("isLoading", false);
            }
        });

        page.bindingContext = vm;
    }
}

/** Regresa a la pantalla anterior en el stack de navegación */
export function onBack() {
    Frame.topmost().goBack();
}

/** Muestra un Toast nativo de Android con el mensaje dado */
function showToast(message: string) {
    const context = Utils.android.getApplicationContext();
    android.widget.Toast.makeText(context, message, android.widget.Toast.LENGTH_SHORT).show();
}