import { SqlRepository } from "./sql-repository";
import { NoSqlRepository } from "./nosql-repository";
import { Book, BOOKS } from "./books-data";

/**
 * Repositorio central que abstrae el acceso a datos.
 * Implementa Singleton para garantizar una única instancia en toda la app.
 * Delega las operaciones al motor activo (SQL o NoSQL) según el modo configurado.
 */
export class BookRepository {
    private static instance: BookRepository;
    private sqlRepo = new SqlRepository();
    private noSqlRepo = new NoSqlRepository();
    
    // Motor activo por defecto: SQLite
    private isSqlMode: boolean = true;

    // Constructor privado: impide instanciación directa (patrón Singleton)
    private constructor() {
        this.seedInitialData();
    }

    /** Devuelve la instancia única; la crea si aún no existe */
    public static getInstance(): BookRepository {
        if (!BookRepository.instance) {
            BookRepository.instance = new BookRepository();
        }
        return BookRepository.instance;
    }

    /** Precarga los libros iniciales en ambos motores si están vacíos */
    private async seedInitialData() {
        const sqlBooks = await this.sqlRepo.getBooks();
        if (sqlBooks.length === 0) {
            for (const b of BOOKS) {
                await this.sqlRepo.addBook(b);
            }
        }

        const noSqlBooks = await this.noSqlRepo.getBooks();
        if (noSqlBooks.length === 0) {
            for (const b of BOOKS) {
                await this.noSqlRepo.addBook(b);
            }
        }
    }

    /** Cambia el motor activo en tiempo de ejecución sin reiniciar la app */
    public setMode(useSql: boolean) {
        this.isSqlMode = useSql;
        console.log(`INFO: Repositorio cambiado a modo ${this.isSqlMode ? 'SQL' : 'NoSQL'}.`);
    }

    /** Indica qué motor está activo actualmente */
    public isUsingSql(): boolean {
        return this.isSqlMode;
    }

    // Las operaciones CRUD delegan al motor activo mediante el operador ternario
    async getBooks(): Promise<Book[]> {
        return this.isSqlMode ? this.sqlRepo.getBooks() : this.noSqlRepo.getBooks();
    }

    async addBook(book: Omit<Book, 'id'>): Promise<void> {
        return this.isSqlMode ? this.sqlRepo.addBook(book) : this.noSqlRepo.addBook(book);
    }

    async deleteBook(id: number): Promise<void> {
        return this.isSqlMode ? this.sqlRepo.deleteBook(id) : this.noSqlRepo.deleteBook(id);
    }

    async updateBook(id: number, book: Omit<Book, 'id'>): Promise<void> {
        return this.isSqlMode ? this.sqlRepo.updateBook(id, book) : this.noSqlRepo.updateBook(id, book);
    }
}