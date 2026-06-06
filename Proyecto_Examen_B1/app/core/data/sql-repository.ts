import { openOrCreate, SQLiteDatabase } from "@nativescript-community/sqlite";
import { Book } from "./books-data";

/**
 * Repositorio SQL usando SQLite a través de nativescript-community/sqlite.
 * Crea la base de datos y la tabla en el primer acceso (lazy initialization).
 */
export class SqlRepository {
    // Instancia de la DB; null hasta el primer uso
    private database: SQLiteDatabase | null = null;

    /**
     * Abre o crea la base de datos y garantiza que la tabla exista.
     * Se llama antes de cada operación para asegurar que la DB esté lista.
     */
    private async getDb(): Promise<SQLiteDatabase> {
        if (this.database) {
            return this.database; // Reutiliza la conexión existente
        }

        try {
            this.database = await openOrCreate("books.db");
            // Crea la tabla solo si no existe (seguro ejecutar varias veces)
            await this.database.execute(`
                CREATE TABLE IF NOT EXISTS books (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT,
                    author TEXT,
                    status TEXT,
                    image TEXT
                )
            `);
            return this.database;
        } catch (error) {
            console.error("ERROR: [SQL] Error en la inicialización", error);
            throw error;
        }
    }

    async getBooks(): Promise<Book[]> {
        try {
            const db = await this.getDb();
            const rows = await db.select("SELECT * FROM books");
            // Mapea cada fila del resultado al tipo Book
            return rows.map((row: any) => ({
                id: row.id,
                title: row.title,
                author: row.author,
                status: row.status,
                image: row.image
            }));
        } catch (error) {
            console.error("ERROR: [SQL] Error al obtener libros", error);
            return [];
        }
    }

    async addBook(book: Omit<Book, 'id'>): Promise<void> {
        try {
            const db = await this.getDb();
            // Usa parámetros posicionales (?) para prevenir SQL injection
            await db.execute(
                "INSERT INTO books (title, author, status, image) VALUES (?, ?, ?, ?)",
                [book.title, book.author, book.status, book.image]
            );
            console.log("INFO: [SQL] Libro agregado");
        } catch (error) {
            console.error("ERROR: [SQL] Error al agregar libro", error);
        }
    }

    async deleteBook(id: number): Promise<void> {
        try {
            const db = await this.getDb();
            await db.execute("DELETE FROM books WHERE id = ?", [id]);
            console.log("INFO: [SQL] Libro eliminado");
        } catch (error) {
            console.error("ERROR: [SQL] Error al eliminar libro", error);
        }
    }

    async updateBook(id: number, book: Omit<Book, 'id'>): Promise<void> {
        try {
            const db = await this.getDb();
            await db.execute(
                "UPDATE books SET title = ?, author = ?, status = ?, image = ? WHERE id = ?",
                [book.title, book.author, book.status, book.image, id]
            );
            console.log("INFO: [SQL] Libro actualizado");
        } catch (error) {
            console.error("ERROR: [SQL] Error al actualizar libro", error);
        }
    }
}