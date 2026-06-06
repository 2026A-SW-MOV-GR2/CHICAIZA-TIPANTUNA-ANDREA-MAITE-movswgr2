import { ApplicationSettings } from "@nativescript/core";
import { Book } from "./books-data";

/**
 * Repositorio NoSQL usando ApplicationSettings de NativeScript.
 * Persiste la colección completa como JSON serializado bajo una clave fija.
 */
export class NoSqlRepository {
    // Clave bajo la cual se almacena el array de libros en ApplicationSettings
    private readonly STORAGE_KEY = "nosql_books_collection";

    async getBooks(): Promise<Book[]> {
        try {
            const data = ApplicationSettings.getString(this.STORAGE_KEY);
            // Si no hay datos guardados, retorna array vacío
            let books: Book[] = data ? JSON.parse(data) : [];
            console.log("DEBUG: [NoSQL] Libros obtenidos");
            return books;
        } catch (error) {
            console.error("ERROR: [NoSQL] Error al obtener libros", error);
            return [];
        }
    }

    async addBook(book: Omit<Book, 'id'>): Promise<void> {
        try {
            const books = await this.getBooks();
            // Genera el siguiente id tomando el máximo existente + 1
            const newId = books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1;
            books.push({ ...book, id: newId });
            // Sobreescribe el storage con la colección actualizada
            ApplicationSettings.setString(this.STORAGE_KEY, JSON.stringify(books));
            console.log("INFO: [NoSQL] Libro agregado");
        } catch (error) {
            console.error("ERROR: [NoSQL] Error al agregar libro", error);
        }
    }

    async deleteBook(id: number): Promise<void> {
        try {
            let books = await this.getBooks();
            // Filtra el libro a eliminar y persiste el resultado
            books = books.filter(b => b.id !== id);
            ApplicationSettings.setString(this.STORAGE_KEY, JSON.stringify(books));
            console.log("INFO: [NoSQL] Libro eliminado");
        } catch (error) {
            console.error("ERROR: [NoSQL] Error al eliminar libro", error);
        }
    }

    async updateBook(id: number, book: Omit<Book, 'id'>): Promise<void> {
        try {
            let books = await this.getBooks();
            const index = books.findIndex(b => b.id === id);
            if (index !== -1) {
                // Reemplaza el libro en la posición encontrada conservando el id
                books[index] = { ...book, id };
                ApplicationSettings.setString(this.STORAGE_KEY, JSON.stringify(books));
                console.log("INFO: [NoSQL] Libro actualizado");
            }
        } catch (error) {
            console.error("ERROR: [NoSQL] Error al actualizar libro", error);
        }
    }
}