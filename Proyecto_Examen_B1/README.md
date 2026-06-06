# App-Biblioteca Personal — NativeScript

> Aplicación móvil Android para gestión de lectura personal con arquitectura híbrida de persistencia dual, conectividad REST y almacenamiento seguro de secretos.  

---

## Índice

- [App-Biblioteca Personal — NativeScript](#app-biblioteca-personal--nativescript)
  - [Índice](#índice)
  - [Descripción general](#descripción-general)
  - [Arquitectura del proyecto](#arquitectura-del-proyecto)
    - [Patrón Repositorio](#patrón-repositorio)
  - [Funcionalidades](#funcionalidades)
    - [Gestión de libros (CRUD)](#gestión-de-libros-crud)
    - [Módulo 1: Comunicación de Red (JSONPlaceholder)](#módulo-1-comunicación-de-red-jsonplaceholder)
    - [Módulo 2: Arquitectura de Persistencia Dual (SQL + NoSQL)](#módulo-2-arquitectura-de-persistencia-dual-sql--nosql)
      - [Operaciones CRUD por motor](#operaciones-crud-por-motor)
    - [Módulo 3: Almacenamiento Seguro y Configuración en Android](#módulo-3-almacenamiento-seguro-y-configuración-en-android)
  - [Librerías y dependencias](#librerías-y-dependencias)
    - [Dependencias principales](#dependencias-principales)
  - [Comandos NativeScript](#comandos-nativescript)
  - [Estilo Material Design 3 (sin librerías)](#estilo-material-design-3-sin-librerías)

---

## Descripción general

App-Biblioteca es una aplicación nativa para Android desarrollada con **NativeScript y TypeScript** que permite al usuario registrar y gestionar sus libros personales. La arquitectura implementa el **Patrón Repositorio** con conmutación en tiempo de ejecución entre motores **SQL (SQLite)** y **NoSQL (ApplicationSettings/JSON)**, sin modificar la interfaz de usuario.

El proyecto integra además conectividad HTTP REST con JSONPlaceholder y gestión de secretos mediante las APIs nativas de Android (SharedPreferences, DataStore Mock y EncryptedSharedPreferences).

---

## Arquitectura del proyecto

```
app/
├── core/                          # Infraestructura — no UI
│   ├── data/
│   │   ├── book-repository.ts     # Singleton — abstrae SQL y NoSQL
│   │   ├── books-data.ts          # Interfaz Book + datos semilla
│   │   ├── nosql-repository.ts    # Persistencia con ApplicationSettings
│   │   └── sql-repository.ts      # Persistencia con SQLite
│   ├── rest-api/
│   │   ├── rest-api.ts            # Lógica GET/PUT con JSONPlaceholder
│   │   └── rest-api.xml           # Vista de conectividad REST
│   └── security/
│       ├── security.ts            # Lógica de los 3 mecanismos de persistencia
│       └── security.xml           # Vista de gestión de secretos
│
├── features/                      # Módulos de UI
│   ├── book-form/
│   │   ├── book-form.ts           # Lógica del formulario (crear/editar)
│   │   └── book-form.xml          # Vista del formulario
│   └── book-list/
│       ├── book-list.ts           # Lógica de la lista principal
│       └── book-list.xml          # Vista de lista con switch SQL/NoSQL
│
├── shared/                        # Componentes reutilizables (escalabilidad futura)
├── fonts/                         # Fuentes personalizadas
├── app-root.xml                   # Raíz de navegación
├── app.css                        # Estilos globales
└── app.ts                         # Punto de entrada

test/                             # Pruebas unitarias
|── repo.spec.ts                  # Tests para BookRepository

```

### Patrón Repositorio

```
Vista (XML) → ViewModel (Observable) → BookRepository (Singleton)
                                              ↓
                               ┌──────────────┴──────────────┐
                          SqlRepository              NoSqlRepository
                          (SQLite)                  (ApplicationSettings)
```

El `BookRepository` es el único punto de acceso a datos desde las vistas. El switch SQL/NoSQL conmuta el motor activo sin que el formulario ni la lista cambien su lógica.

---

## Funcionalidades

### Gestión de libros (CRUD)
- **Crear** libro con título, autor, estado de lectura, portada e imagen desde galería
- **Leer** lista de libros desde el motor activo (SQL o NoSQL)
- **Editar** libro navegando al formulario con datos precargados
- **Eliminar** libro con confirmación mediante AlertDialog nativo de Android

### Módulo 1: Comunicación de Red (JSONPlaceholder)
- Consulta de posts por ID vía GET a JSONPlaceholder
- Actualización de posts vía PUT con validación de respuesta
- Manejo de estados de carga (isLoading) para deshabilitar botones en tránsito


### Módulo 2: Arquitectura de Persistencia Dual (SQL + NoSQL)
- Switch interactivo en la barra superior de la lista y el formulario
- Cambio instantáneo entre SQLite y ApplicationSettings sin reiniciar la app
- Indicador visual del motor activo en la UI
- Los datos de cada motor son independientes entre sí

#### Operaciones CRUD por motor

| Operación | SQLite (`sql-repository.ts`) | NoSQL (`nosql-repository.ts`) |
|---|---|---|
| **Create** | `INSERT INTO books ...` con parámetros `?` | `push()` al array + `setString()` |
| **Read** | `SELECT * FROM books` | `getString()` + `JSON.parse()` |
| **Update** | `UPDATE books SET ... WHERE id = ?` | `findIndex()` + reemplaza + `setString()` |
| **Delete** | `DELETE FROM books WHERE id = ?` | `filter()` + `setString()` |



### Módulo 3: Almacenamiento Seguro y Configuración en Android
- Tres mecanismos seleccionables desde un ListPicker:
  - **SharedPreferences** — texto plano, síncrono
  - **DataStore Mock** — archivo JSON asíncrono (simula Jetpack DataStore)
  - **EncryptedSharedPreferences** — cifrado AES-256 SIV / AES-128 GCM

---

## Librerías y dependencias

### Dependencias principales

```json
{
  "@nativescript/core": "~8.x",
  "@nativescript-community/sqlite": "latest"
}
```

## Comandos NativeScript

```bash
# Ejecutar en emulador Android
ns run android

# Compilar solo (sin ejecutar)
ns build android

# Limpiar caché de compilación
ns clean
```

---

## Estilo Material Design 3 (sin librerías)

El proyecto aplica los principios de Material Design 3 directamente en XML y CSS, sin usar librerías de componentes.

---