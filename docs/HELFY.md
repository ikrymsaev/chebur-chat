# Helfy

Helfy — a TypeScript UI framework with a decorator-oriented API, custom JSX, and fine-grained reactivity.

Components are defined as classes with the `@View` decorator, state is managed via `@state` and `@observable`, and templates use extended JSX with `@if`, `@for`, and `@else` directives. Reactivity is built on signals (similar to SolidJS): `render()` runs once, and subsequent DOM updates are granular — only nodes that read the changed signal are updated.

## Table of contents

- [Installation](#installation)
- [Components](#components)
  - [Basic component](#basic-component)
  - [Props](#props)
  - [Local state (@state)](#local-state-state)
  - [Nested components](#nested-components)
  - [DOM mounting](#dom-mounting)
  - [DOM and component refs (@ref)](#dom-and-component-refs-ref)
  - [Two-way binding (@bind)](#two-way-binding-bind)
  - [Forms (@Form, @field, @field in JSX)](#forms-form-field-field-in-jsx)
- [Template directives](#template-directives)
  - [@if / @elseif / @else](#if--elseif--else)
  - [@for](#for)
  - [@empty](#empty)
- [State Management](#state-management)
  - [Architecture layers (Store, Service, UseCase)](#state-management)
  - [Creating a Store](#creating-a-store-store)
  - [Infrastructure services](#infrastructure-services-service)
  - [Business use cases](#business-use-cases-usecase)
  - [Accessing Store and UseCase from components](#accessing-store-and-usecase-from-components)
  - [Store context (optional)](#store-context-optional)
- [Logging (@logger)](#logging-logger)
- [Context & DI](#context--di)
  - [Provider (@Context)](#provider-context)
  - [Consumer (@useCtx)](#consumer-usectx)
  - [Reactive fields](#reactive-fields)
  - [Optional injection](#optional-injection)
  - [DI: props vs dependencies](#di-props-vs-dependencies)
  - [Global services (@inject)](#global-services-inject)
- [JSX](#jsx)
  - [Attributes](#attributes)
  - [Events](#events)
  - [Styles](#styles)
  - [CSS classes](#css-classes)
- [API](#api)

---

## Installation

### Creating a new project (helfy-create)

Quick start — create a project with a single command:

```bash
npx helfy-create my-app
cd my-app
npm run dev
```

Without a project name (creates `helfy-app`):

```bash
npx helfy-create
```

The `--skip-install` option — create without running `npm install` (e.g. for offline use or custom registry).

### Adding to an existing project

```bash
npm install @helfy/helfy
```

Or in `package.json`:

```json
{
  "dependencies": {
    "@helfy/helfy": "^0.0.1"
  }
}
```

### Build setup

The Babel plugin runs the DI scanner and context scanner before transformation (no pre-scripts in `package.json` needed). The scanners generate `.helfy/di-tokens.ts`, `.helfy/di-registry.ts`, and `.helfy/ctx-tokens.ts`. Add `.helfy` to `.gitignore`.

### Babel

A single preset in `.babelrc` is enough:

```json
{
  "presets": ["@helfy/helfy/babel-preset"]
}
```

The preset includes: JSX runtime, TypeScript, legacy decorators, class properties, babel-plugin-transform-typescript-metadata, **helfy-di** (compile-time DI for `@Injectable<IX>()`, `@Service<IX>()`, `@UseCase<IX>()`, `@Store`, `@inject<IX>()`, `@useCtx<IX>()`, auto-registration at `createApp`, `@logger()` → `@logger("<ClassName>")` transformation).

### Webpack / Rspack

To process directives (`@if`, `@for`, `@ref`, `@bind`, `@field`) in `.tsx` files, add the loader:

```javascript
{
  test: /\.tsx$/,
  use: [
    'babel-loader',
    require.resolve('@helfy/helfy/compiler/helfy-loader'),
  ],
}
```

The same configuration works with both Webpack and Rspack. Rspack is a faster, Rust-based bundler with webpack-compatible API.

### TypeScript

In `tsconfig.json` set:

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "plugins": [{ "name": "@helfy/helfy-ts-plugin" }]
  }
}
```

The `@helfy/helfy-ts-plugin` plugin provides IDE support for `@if`, `@for`, `@ref`, `@bind`, `@field` directives (autocomplete, typing, go-to-definition). Install separately: `npm install @helfy/helfy-ts-plugin`.

---

## Components

### Basic component

A component is a class with the `@View` decorator and a `render()` method that returns JSX:

```tsx
import { View } from "@helfy/helfy";

@View
class Hello {
    render() {
        return (
            <div>
                <h1>Hello, Helfy!</h1>
            </div>
        );
    }
}
```

The `@View` decorator automatically:
- calls `render()` **once** and mounts the result into a DOM fragment
- adds a `view` property (reference to the root DOM element)
- wraps `this.props` in a reactive Proxy (each prop is a signal)
- configures fine-grained effects: when a signal changes, only the specific DOM node that reads it is updated, not the entire component

> **Important:** When inheriting from `@View`, apply the decorator on the child class as well. Otherwise `@useCtx`, `scheduleUpdate`, and DOM updates will not work.

### Props

Props are passed via the constructor. The `@View` decorator wraps `this.props` in a reactive Proxy — each prop becomes a signal. This means that when the parent updates props, only the DOM nodes that read them are updated, without a full re-render.

> **Important:** Do not destructure `this.props` in `render()`. Access fields directly via `this.props.field` — this ensures correct signal subscription.

```tsx
import { View } from "@helfy/helfy";

interface ButtonProps {
    label: string;
    type?: "button" | "submit";
    onClick?: () => void;
}

@View
class Button {
    constructor(private readonly props: ButtonProps) {}

    render() {
        return (
            <button
                type={this.props.type ?? "button"}
                onclick={this.props.onClick}
            >
                {this.props.label}
            </button>
        );
    }
}
```

Usage:

```tsx
<Button label="Click" onClick={() => console.log('clicked')} />
```

When the parent updates props, only the DOM nodes that read the changed props are updated.

### Local state (@state)

The `@state` decorator makes a field reactive. When its value changes, only the DOM nodes and effects that read it are updated (fine-grained). The component is not fully re-rendered:

```tsx
import { View, state } from "@helfy/helfy";

@View
class Counter {
    @state private count = 0;

    increment() {
        this.count++; // updates only nodes that read count
    }

    decrement() {
        this.count--;
    }

    render() {
        return (
            <div>
                <span>{this.count}</span>
                <button onclick={this.increment.bind(this)}>+</button>
                <button onclick={this.decrement.bind(this)}>-</button>
            </div>
        );
    }
}
```

You can declare multiple `@state` fields. Each independently triggers updates only in the DOM nodes that read it.

Signal primitives (`createSignal`, `createEffect`, `createComputed`, `batch`, `onCleanup`) are also exported from `helfy` and can be used directly, but in most cases `@state`, `@computed`, and `@effect` are sufficient.

### Nested components

Components are used in JSX as tags. Props are passed as attributes:

```tsx
import { View } from "@helfy/helfy";

@View
class App {
    render() {
        return (
            <div>
                <Counter />
                <Button label="Hello" onClick={() => {}} />
            </div>
        );
    }
}
```

### DOM mounting

Typical bootstrap is via `createApp()`: an instance is created, `attach(root)` is called internally, and the `onAttached()` hook runs after insertion into the document.

```typescript
import { createApp } from "@helfy/helfy";

createApp({ root: document.getElementById("root")! })
  .router({ routes })
  .mount(App);
```

For scenarios without routing:

```typescript
createApp({ root: document.getElementById("root")! }).mount(App);
```

Manual mounting (without `createApp`): `const app = new App(); app.attach(root)`.

### DOM and component refs (@ref)

The `@ref` decorator marks a field to receive a reference to a DOM element or component instance. In JSX use the `@ref(this.fieldName)` directive. The reference is available after `onMount()`. For operations like `focus()` that require the element in the document, use `onAttached()`.

**For components** — the parent receives a proxy with access only to methods marked with `@expose`. This lets you explicitly define the component's public API.

```tsx
import { View, ref, expose } from "@helfy/helfy";

@View
class Input {
    @ref private inputEl!: HTMLInputElement;

    @expose focus() {
        this.inputEl?.focus();
    }

    render() {
        return <input @ref(this.inputEl) type="text" />;
    }
}

@View
class Form {
    @ref private input!: Input;

    onAttached() {
        this.input.focus();  // only the exposed method is available
    }

    render() {
        return <Input @ref(this.input) />;
    }
}
```

- DOM elements via `@ref` are passed as-is
- Components with `@expose` — parent sees only the exposed methods
- Components without `@expose` — the full instance is passed (backward compatibility)

With conditional rendering (`@if`), the ref is cleared when the element is removed. Do not use `@ref` and `@state` on the same field.

### Two-way binding (@bind)

The `@bind` directive is syntactic sugar for two-way binding of a `@state` field to a form element. Syntax: `@bind(expr)` — parentheses, like `@ref`. The compiler generates the `value`/`checked` pair and event handler.

```tsx
import { View, state } from "@helfy/helfy";

@View
class LoginForm {
    @state private username = '';
    @state private email = '';
    @state private isActive = true;

    render() {
        return (
            <form>
                <input @bind(this.username) type="text" />
                <input @bind(this.email) type="email" />
                <input @bind(this.isActive) type="checkbox" />
                <select @bind(this.priority)>
                    <option value="low">Low</option>
                    <option value="high">High</option>
                </select>
            </form>
        );
    }
}
```

Transformation by element type:

| Element | Attribute | Event |
|---------|-----------|-------|
| `input[text|email|password|...]` | `value` | `oninput` |
| `input[checkbox|radio]` | `checked` | `onchange` |
| `select` | `value` | `onchange` |
| `textarea` | `value` | `oninput` |

The field must be marked with `@state` for reactive UI updates. For union types (e.g. `TodoPriority`), use `as typeof expr` — type safety is preserved.

**Custom components:** for binding to a component with a `value` prop, use named binding `@bind:value(expr)`:

```tsx
// Parent
<Input @bind:value(this.title) placeholder="Title" />

// Input component with @binded("value")
@View
class Input {
  @binded("value") private bindedVal!: string;
  // ...
  render() {
    return <input @bind(this.bindedVal) type="text" />;
  }
}
```

### Forms (@Form, @field, @field in JSX)

Centralized form handling with validation via context: `@Form` — form context class, `@field` — field decorator (creates `FieldState`), `@useForm` — injects the form into a component. The JSX directive `@field(expr)` connects an input to `FieldState` in one line.

**FormContext** — a class with `@Form` and `@field` fields:

```tsx
import { Form, field, logger, type FieldState, type ILogger } from "@helfy/helfy";

@Form
export class LoginFormContext {
  @logger() private log!: ILogger;

  @field({ defaultValue: "" })
  email!: FieldState<string>;

  @field({ defaultValue: "" })
  password!: FieldState<string>;

  @field({ defaultValue: false })
  rememberMe!: FieldState<boolean>;

  validateAll(): boolean {
    // validate fields, set field.error
    return true;
  }

  submit() {
    if (!this.validateAll()) {
      this.log.warn("Submit validation failed");
      return;
    }
    this.log.info("Submit", { email: this.email.value });
  }
}
```

**FieldState** has `value`, `isDirty`, `isTouched`, `error`, `isValid`. When `value`/`error`/`isTouched` changes, components with `@useForm` re-render.

**Form provider** — the parent component wraps the form in context:

```tsx
// LoginPage.tsx
@View
export class LoginPage {
  render() {
    return (
      <LoginFormContext>
        <LoginForm />
      </LoginFormContext>
    );
  }
}
```

**Form component** — inject via `@useForm`, access fields via `this.form`:

```tsx
import { View, useForm } from "@helfy/helfy";
import { LoginFormContext } from "./LoginFormContext";

@View
export class LoginForm {
  @useForm(LoginFormContext) private form!: LoginFormContext;

  render() {
    return (
      <form onsubmit={(e: Event) => { e.preventDefault(); this.form.submit(); }}>
        <input @field(this.form.email) type="email" class="input" />
        {this.form.email.isTouched && this.form.email.error && (
          <span class="error">{this.form.email.error}</span>
        )}
        <input @field(this.form.password) type="password" class="input" />
        <input @field(this.form.rememberMe) type="checkbox" id="remember" />
        <label for="remember">Remember me</label>
        <button type="submit">Sign in</button>
      </form>
    );
  }
}
```

Wrapper components (TextField, CheckboxField, etc.) accept `$field` as a writable prop: `<TextField $field={this.form.email} label="Email" />` and use `<input @field(this.props.$field) />` internally. The `$` prefix marks a writable prop — mutable objects like FieldState bypass the default signal-based (readonly) props so form inputs work correctly.

**JSX directive `@field(expr)`** — one directive replaces `@bind` + `onblur` + error `class` + `aria-invalid`. The compiler generates:

- `value`/`checked` and `oninput`/`onchange`
- `onblur` → `expr.isTouched = true`
- `class` — merged with existing; when `expr.isTouched && expr.error` adds `input-error`
- `aria-invalid={expr.isTouched && expr.error ? "true" : "false"}`

Supports `input` (text, email, password, checkbox, radio), `select`, `textarea`. The `.input-error` class can be defined in global styles (e.g. `@apply border-red-500` in Tailwind).

---

## Template directives

Helfy extends JSX with `@if`, `@elseif`, `@else`, `@for`, and `@empty` directives.

### @if / @elseif / @else

Conditional rendering:

```tsx
render() {
    return (
        <div>
            @if (this.count > 0) {
                <span>Positive: {this.count}</span>
            }
        </div>
    );
}
```

Condition chains:

```tsx
render() {
    return (
        <div>
            @if (this.status === 'loading') {
                <span>Loading...</span>
            } @elseif (this.status === 'error') {
                <span>Error!</span>
            } @else {
                <span>Data loaded</span>
            }
        </div>
    );
}
```

Nested conditions:

```tsx
@if (this.isVisible) {
    <div>
        @if (this.count > 10) {
            <span>More than ten</span>
        }
    </div>
}
```

### @for

Array iteration. Syntax: `@for (item of array)` or `@for (item, index of array)`.

```tsx
@state private items = ['apple', 'banana', 'cherry'];

render() {
    return (
        <ul>
            @for (item, i of this.items; track item) {
                <li>{i}: {item}</li>
            }
        </ul>
    );
}
```

`track` sets the key for DOM diffing optimization (like `key` in React):

```tsx
@for (user of this.users; track user.id) {
    <UserCard name={user.name} />
}
```

### @empty

The `@empty` block after `@for` renders when the array is empty:

```tsx
@for (item of this.items; track item) {
    <div>{item}</div>
} @empty {
    <span>List is empty</span>
}
```

---

## State Management

Helfy uses a three-layer architecture: **@Store** (pure state), **@Service** (infrastructure), **@UseCase** (business logic).

### Dependency flow

```
@UseCase  ──→  @Store  ←──  @Service
   │                 ↑
   └─────────────────┘
```

- **@Store** — pure reactive state; no dependencies, no side effects. Store does not know about anyone.
- **@Service** — infrastructure (HTTP, validation, storage); can inject Store and other Services.
- **@UseCase** — orchestrates business scenarios; injects Store + Services.

### Creating a Store (@Store)

A Store is a global reactive state container. **Requirements:**
- Empty constructor (no parameters)
- Only `@state` on fields and `@computed` on getters
- Mutation methods that only change own state (synchronous; no `await` — async work belongs in @Service)
- **Forbidden:** `@inject`, `@useCtx`, `@effect`, direct access to HTTP/storage/timers

```typescript
import { Store, state, computed } from "@helfy/helfy";

@Store
class TodoStore {
  @state todos: Todo[] = [];
  @state filter: "all" | "active" | "completed" = "all";

  @computed get filteredTodos() {
    switch (this.filter) {
      case "active": return this.todos.filter(t => !t.completed);
      case "completed": return this.todos.filter(t => t.completed);
      default: return this.todos;
    }
  }

  add(title: string) {
    this.todos = [...this.todos, { id: crypto.randomUUID(), title, completed: false }];
  }

  toggle(id: string) {
    this.todos = this.todos.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
  }

  setFilter(f: typeof this.filter) {
    this.filter = f;
  }
}
```

Fields use `@state` or `@observable` — both create signals.

### Infrastructure services (@Service)

Use `@Service` for infrastructure: HTTP clients, validators, repositories. **Requirements:**
- Constructor with DI dependencies (other Services, Store)
- Provides atomic technical capabilities
- Can directly mutate Store (e.g. after fetching data)
- **Forbidden:** `@state`, `@computed`, `@effect` on fields

```typescript
import { Service } from "@helfy/helfy";

export interface ITodoValidateService {
  validateTitle(title: string): ValidationResult;
}

@Service<ITodoValidateService>()
export class TodoValidateService implements ITodoValidateService {
  validateTitle(title: string) {
    // ...
  }
}
```

### Business use cases (@UseCase)

Use `@UseCase` to orchestrate business scenarios. **Requirements:**
- Constructor with DI (Store, Services)
- Main public method: `execute`, `perform`, or `handle`
- Typical flow: validation → call services → update Store → side effects (notifications, analytics)
- **Forbidden:** `@state`, `@computed`, `@effect` on fields

```typescript
import { UseCase } from "@helfy/helfy";

@UseCase<ICreateTodoUseCase>()
export class CreateTodoUseCase implements ICreateTodoUseCase {
  constructor(
    private store: TodoStore,
    private validateService: ITodoValidateService
  ) {}

  async execute(dto: CreateTodoDto): Promise<Result<Todo, AppError>> {
    const validation = this.validateService.validateTitle(dto.title);
    if (!validation.valid) return Err(validation.error);

    const todo = { id: crypto.randomUUID(), ...dto, completed: false };
    this.store.add(todo);
    return Ok(todo);
  }
}
```

### HttpClient and ApiClient

Helfy provides an HTTP client and a Query/Mutation layer (similar to TanStack Query) for API data fetching.

**Configure HttpClient** in `createApp`:

```typescript
createApp({ root: document.getElementById("root")! })
  .http({
    baseUrl: "/api",
    timeout: 10000,
    headers: { "X-App-Version": "1.0" },
    queryCacheMaxSize: 100,
  })
  .router({ routes })
  .mount(App);
```

**Define API interface and implementation** with `@ApiClient` and `@queryConfig`:

```typescript
import { ApiClient, queryConfig, QueryBuilder, type Query, type HttpClient } from "@helfy/helfy";

export interface TodoApi {
  todos(): Query<Todo[]>;
}

@ApiClient<TodoApi>()
export class TodoApiImpl implements TodoApi {
  constructor(private readonly http: HttpClient) {}

  @queryConfig("todos")
  todos() {
    return new QueryBuilder<Todo[]>(["todo"])
      .fn(() => this.http.get<Todo[]>("/todos"))
      .staleTime(5 * 60 * 1000)
      .refetchOnWindowFocus(true);
  }
}
```

**Use `@useQuery` in View** for automatic fetch on mount:

```tsx
@View
class TodoList {
  @useQuery<TodoApi>("todos") private todosQuery!: Query<Todo[]>;

  render() {
    const q = this.todosQuery;
    if (q.isLoading) return <Spinner />;
    if (q.isError) return <ErrorMessage error={q.error} />;
    return <ul>{q.data?.map((t) => <li>{t.text}</li>)}</ul>;
  }
}
```

**Use `@useMutation`** for imperative mutations:

```tsx
import type { Mutation } from "@helfy/helfy";

@useMutation<TodoApi>("create") private createTodo!: Mutation<TodoItem, AddTodoDto>;

async handleSubmit() {
  await this.createTodo.mutateAsync({ title: this.title });
}
```

### Accessing Store and UseCase from components

Inject Store and UseCase via `@inject` in View/Context. Prefer UseCase for mutations, Store for reads:

```tsx
import { View, inject } from "@helfy/helfy";

@View
class TodoList {
  @inject<ITodoStore>() private store!: ITodoStore;
  @inject<ICreateTodoUseCase>() private createTodo!: ICreateTodoUseCase;

  render() {
    return (
      <ul>
        @for (todo of this.store.filteredTodos; track todo.id) {
          <li>{todo.title}</li>
        }
      </ul>
    );
  }
}
```

---

## Logging (@logger)

The `@logger` decorator injects a logger into View, Context, Store, Service, and UseCase classes. The class name is set at compile time (Babel plugin), keeping readable names even after minification.

### Usage

```tsx
import { View, logger, type ILogger } from "@helfy/helfy";

@View
class TodoInput {
  @logger() private log!: ILogger;   // auto: <TodoInput>

  onAttached() {
    this.log.debug("todo input attached");
    this.log.info("todo added", { title: this.title });
    this.log.warn("validation failed", { error: result.error });
  }
}
```

**Variants:**
- `@logger()` — class name is set at compile-time as `<ClassName>`, format and color depend on class type
- `@logger("my-tag")` — custom tag, gray color

### Tag format and color by class type

| Type | Format | Color |
|------|--------|-------|
| View (components) | `<TodoInput>` | skyblue |
| Service / Injectable | `TodoValidateService()` | pink |
| UseCase | `CreateTodoUseCase()` | pink |
| Context | `{TodoContext}` | khaki |
| Form | `[LoginFormContext]` | bright blue |
| Store | `TodoStore[]` | lime green |
| Custom `@logger("...")` | as specified | gray |

### Logger API

```typescript
interface ILogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(messageOrError: string | Error, meta?: Record<string, unknown>): void;
  withContext(ctx: string): ILogger;  // child logger with extra prefix
}
```

### DI and transports

`LoggerService` is registered under `ILoggerToken` via `registerAllServices`. Custom transports (Sentry, file, etc.) implementing `ILogTransport` can be wired up:

```typescript
import { LoggerService, ConsoleTransport, ILoggerToken } from "@helfy/helfy";

const transports = [new ConsoleTransport(), /* mySentryTransport */];
createApp({ root })
  .configureContainer((c) => {
    c.bind(ILoggerToken, { useClass: LoggerService, deps: [transports] });
  })
  .mount(App);
```

Without a registered logger in the container, a fallback that logs to `console` is used.

---

## Context & DI

Helfy supports hierarchical Context and Dependency Injection: a provider wraps a subtree in JSX, and child components receive values via `@useCtx`. Useful for theme, forms, routing, and other shared dependencies.

### Provider (@Context)

A class with the `@Context` decorator is a non-rendering provider: it has no `render()` and only renders its children. Use `@state` for reactive fields, `@computed` for derived values; public methods are exposed automatically.

**Constructor:** receives only props from JSX. Define your own props interface (same as View). Use `@inject` for container dependencies.

```tsx
import { Context, state } from "@helfy/helfy";

export type TThemeMode = "light" | "dark";

@Context
export class ThemeContext {
  @state
  mode: TThemeMode = "dark";

  toggle = () => {
    this.mode = this.mode === "dark" ? "light" : "dark";
  };
}
```

Usage in JSX — wrap a subtree:

```tsx
<ThemeContext>
  <Header />
  <Main />
</ThemeContext>
```

The framework only renders the children of `ThemeContext`; the provider itself does not create DOM nodes.

**Context with typed props** — define an interface and use it in the constructor (same pattern as View):

```tsx
interface ApiContextProps {
  baseUrl: string;
}

@Context
export class ApiContext {
  constructor(readonly props: ApiContextProps) {}
  // ...
}
```

### Consumer (@useCtx)

A component with `@View` can receive context values via `@useCtx`:

```tsx
import { View, useCtx } from "@helfy/helfy";
import { ThemeContext } from "./ThemeContext";

@View
class ThemeToggle {
  @useCtx(ThemeContext)
  private theme!: ThemeContext;

  render() {
    return (
      <button onclick={this.theme.toggle}>
        {this.theme.mode === "dark" ? "Light theme" : "Dark theme"}
      </button>
    );
  }
}
```

You can inject only a context field:

```tsx
@View
class ModeDisplay {
  @useCtx(ThemeContext, "mode")
  private mode!: TThemeMode;

  render() {
    return <span>Current theme: {this.mode}</span>;
  }
}
```

**Interface-based injection** — for contexts with `@Context<IX>()`, use `@useCtx<ITodoContext>()`:

```tsx
@useCtx<ITodoContext>()
private ctx!: ITodoContext;

@useCtx<ITodoContext>("filteredTodos")
private filteredTodos!: ITodoContext["filteredTodos"];
```

Provider lookup goes up the tree (`_parentView`); the nearest provider with the matching key is used.

### Reactive fields

`@state` makes a field reactive: when it changes, all consumers re-render. Public methods are exposed automatically.

**Computed fields** — getters with `@computed` recompute when dependencies change and trigger consumer re-renders:

```tsx
@computed
get filteredTodos(): Todo[] {
  return this.filter === "active"
    ? this.todos.filter(t => !t.completed)
    : this.todos;
}
```

### Optional injection

The third argument of `@useCtx` — options `{ optional?, defaultValue? }`:

```tsx
@useCtx(ThemeContext, { optional: true })
private theme?: ThemeContext;

@useCtx(ThemeContext, "mode", { defaultValue: "light" })
private mode = "light";
```

With no provider in the tree, `optional: true` yields `undefined`; `defaultValue` is used when the provider is absent.

### DI: props vs dependencies

**View and Context:** constructor receives only props from JSX. Dependencies are injected via field decorators:
- `@inject<IX>()` — from global container (Store, Service, UseCase)
- `@useCtx<IX>()` — from tree @Context / @Form providers

**@Service and @UseCase:** constructor DI via `@diParams` (added by Babel plugin) for injected dependencies.

### Global services (@inject)

Use `@inject<IX>()` in View/Context to access Store, Service, and UseCase from the container:

```typescript
// Define interface and implement with @Service
export interface ITodoValidateService {
  validate(title: string): ValidationResult;
}

@Service<ITodoValidateService>()
export class TodoValidateService implements ITodoValidateService {
  validate(title: string) { ... }
}
```

**Consumer (View)** — inject Store or UseCase:

```tsx
@View
class TodoInput {
  @inject<ITodoValidateService>() private validateService!: ITodoValidateService;
  @inject<ICreateTodoUseCase>() private createTodo!: ICreateTodoUseCase;

  constructor(readonly props: Props) {}

  render() {
    // Call UseCase for mutations, Service for validation
    return <form onsubmit={() => this.createTodo.execute(this.form.getPayload())}>...</form>;
  }
}
```

**Bootstrap** — DI registration is automatic at `createApp` (plugin injects `.useDI(registerAllServices)`):

```typescript
createApp({ root: document.getElementById("root")! })
  .router({ routes })
  .mount(App);
```

The DI scanner finds `@Store`, `@Service<IX>()`, `@UseCase<IX>()` and generates `.helfy/di-tokens.ts`, `.helfy/di-registry.ts`.

**Fallback** — for manual setup: `.configureContainer()`, `@Injectable(token)`:

```typescript
createApp({ root })
  .configureContainer((c) => {
    c.bind(HttpClient, { useClass: AxiosHttpClient });
    c.autoRegister(SomeService);
  })
  .router({ routes })
  .mount(App);
```

Optionally: pass a custom container via `.container(myContainer)` or `createApp({ root, container })`.

`@Context` and the container coexist: Context is for tree-scoped values (theme, router), Container for global services.

---

## JSX

Helfy uses a custom JSX runtime (`@helfy/helfy/jsx-runtime`). JSX is translated to `jsx()` / `jsxs()` calls that build a virtual DOM representation.

### Attributes

Standard HTML attributes are passed through:

```tsx
<input type="text" placeholder="Enter name" />
<img src="/logo.png" alt="Logo" />
<div id="container" class="wrapper"></div>
```

### Events

Event handlers use **lowercase** attributes (`onclick`, `oninput`, not `onClick`):

```tsx
<button onclick={() => this.increment()}>+</button>
<input oninput={(e) => this.handleInput(e)} />
```

### Styles

Inline styles use an object with camelCase keys:

```tsx
<div style={{
    backgroundColor: '#f0f0f0',
    fontSize: '16px',
    padding: '8px 16px',
    borderRadius: '4px'
}}>
    Styled block
</div>
```

### CSS classes

The `class` attribute accepts a string or an array with conditional classes:

```tsx
// string
<div class="container">...</div>

// CSS Modules
import styles from './App.module.css';
<div class={styles.wrapper}>...</div>

// conditional classes via array
<div class={[
    styles.cell,
    [styles.active, this.isActive],     // applied when this.isActive === true
    [styles.disabled, this.isDisabled],
]}>...</div>
```

---

## API

### Decorators

| Decorator | Scope | Description |
|-----------|-------|-------------|
| `@View` | Class | Turns a class into a component with `render()`, `view`, `update()` |
| `@state` | Field | Component local state on signals (write updates only this component) |
| `@Store` | Class | Global reactive state. Empty constructor; only `@state`/`@computed`. No `@inject`, `@useCtx`, `@effect`, or external I/O |
| `@observable` | Field | Alias for `@state` in Store; makes field reactive |
| `@Service<IX>()` | Class | Infrastructure (HTTP, validation, repos). Constructor DI. No `@state`/`@computed`. Can mutate Store |
| `@UseCase<IX>()` | Class | Business scenarios. Injects Store + Service. Main method: `execute`/`perform`/`handle`. No `@state`/`@computed` |
| `@Context` | Class | Non-rendering context provider; renders only children |
| `@state` / `@computed` | Context field | In `@Context`: `@state` for reactive fields, `@computed` for derived getters. Public methods exposed automatically |
| `@inject<IX>()` | Field | Injects Store, Service, or UseCase from container. Use in View/Context |
| `@useCtx(ContextClass)` / `@useCtx<IX>()` / `@useCtx(ContextClass, field)` | Field | Injects context or a context field from the nearest provider up the tree |
| `@Injectable<IX>()` | Class | Generic injectable. Prefer `@Service` for infrastructure, `@UseCase` for business logic |
| `@logger()` / `@logger("tag")` | Field | Injects ILogger. No arg — compile-time class name and color by type (View/Context/Store/Injectable). With arg — custom tag (gray) |
| `@ref` | Field | Marks a field to receive a DOM or component reference (use with `@ref(this.fieldName)` in JSX) |
| `@expose` | Method | Makes a method available to the parent when using `@ref` on a component (without `@expose` the parent gets the full instance) |
| `@binded(name)` | Field | Binds a field to `@bind:name` from the parent (for custom components) |
| `@bind(expr)` / `@bind:name(expr)` | JSX | Two-way binding with `@state` field (value/checked + oninput/onchange). For components: `@bind:value(expr)` |
| `@ApiClient<IX>()` | Class | API client with `@queryConfig` / `@mutationConfig` methods. Registers as Service by interface |
| `@queryConfig(keyTemplate)` | Method | Marks method as Query; returns QueryBuilder chain, decorator calls `.build()` |
| `@mutationConfig(options?)` | Method | Marks method as Mutation; merges invalidateQueries, optimisticFn into Mutation |
| `@useQuery<ApiInterface>(keyOrGetter)` | Field | Injects Query from ApiClient, refetch on mount, reactive data/isLoading/isError |
| `@useMutation<ApiInterface>(methodName)` | Field | Injects Mutation from ApiClient by method name |
| `@Form` | Class | Form context with `@field` fields |
| `@field(options)` | FormContext field | Creates FieldState for a form field (value, isTouched, error, isDirty) |
| `@useForm(FormContext)` | Field | Injects the form into a component with subscription to field changes |
| `@field(expr)` | JSX | Connects an input to FieldState: value/checked + onblur + error class + aria-invalid |

### Routing (SPA)

Helfy includes a lightweight SPA router. When you call `createApp().router({ routes }).mount(App)`, the framework automatically wraps the app in `RouterContext`, so you don't need to wrap your App manually:

```tsx
// index.ts
createApp({ root: document.getElementById("root")! })
  .router({ routes })
  .mount(App);
```

```tsx
import { View, RouterView, Link, path, type RouteConfig } from "@helfy/helfy";

const routes: RouteConfig[] = [
  { path: "/", component: HomePage },
  { path: "/analytics", component: AnalyticsPage },
  { path: "/settings", component: SettingsPage },
  { path: "/debug/:id", component: DebugPage },
];

@View
class App {
  render() {
    return (
      <Layout>
        @slot.sidebar() {<Sidebar />}
        @slot.content() {<RouterView />}
      </Layout>
    );
  }
}

@View
class Sidebar {
  @path()
  private pathname!: string;

  render() {
    const isHome = this.pathname === "/";
    const isAnalytics = this.pathname.startsWith("/analytics");

    return (
      <nav>
        <Link to="/" label="Home" class={isHome ? "font-bold" : ""} />
        <Link to="/analytics" label="Analytics" class={isAnalytics ? "font-bold" : ""} />
      </nav>
    );
  }
}
```

A typical page component can use router decorators:

```tsx
import { View, path, search, params, router, type RouterAPI } from "@helfy/helfy";

@View
class DebugPage {
  @path()
  private pathname!: string;

  @params()
  private routeParams!: Record<string, string>;

  @search()
  private query!: Record<string, string>;

  @router()
  private rtr!: RouterAPI;

  render() {
    return (
      <section>
        <h1>Debug</h1>
        <pre>pathname: {this.pathname}</pre>
        <pre>params: {JSON.stringify(this.routeParams)}</pre>
        <pre>query: {JSON.stringify(this.query)}</pre>
        <button onclick={() => this.rtr.push("/analytics")}>
          Go to analytics
        </button>
      </section>
    );
  }
}
```

**Custom 404 page.** Wrap `RouterView` and override the `notFound` slot:

```tsx
@View
class AppRouter {
  render() {
    return (
      <RouterView>
        @slot.notFound({ pathname }) {
          <MyNotFound pathname={pathname} />
        }
      </RouterView>
    );
  }
}
```

### Component lifecycle

1. `constructor(props)` — instance creation, `this.props` wrapped in reactive Proxy
2. `render()` — returns JSX (**called once** on mount)
3. `mount()` — initial JSX render to DOM fragment
4. `onMount()` — hook after first mount (optional)
5. `onAttached()` — hook after insertion into document (optional). Called on `attach(parent)`.
6. `update()` — structural update (e.g. on route change). For the same child component, only signals are updated via `updateProps`
7. `updateProps(newProps)` — updates prop signals (fine-grained, no full re-render)

#### onMount vs onAttached

| | `onMount()` | `onAttached()` |
|---|---|---|
| **When** | Right after `mount()`, tree built, refs assigned | After `attach(parent)`, element in document |
| **Element in document** | May not be yet (root in fragment) | Yes |
| **Refs** | Available | Available |

**`onMount()`** — for initialization that doesn't need the document:
- Subscriptions to store/observable/services
- Internal state setup
- Adding handlers (works on detached nodes too)

**`onAttached()`** — for operations that require the element in the document:
- `focus()`, `scrollIntoView()`
- `getBoundingClientRect()`, layout measurement
- Any DOM API that only works on attached nodes

```tsx
@View
class SearchInput {
  @ref private input!: HTMLInputElement;

  onMount() {
    this.store.subscribe(this.handleChange);  // subscription — document not needed
  }

  onAttached() {
    this.input.focus();  // focus — needs document
  }
}
```

### Slots (content projection)

Helfy supports named slots with fallback content and override in child components.

#### Slot provider (`@View` component)

Slots are declared in JSX via the `@slot:name(...)` directive inside `render()`:

```tsx
import { View } from "@helfy/helfy";

@View
class AppLayout {
    render() {
        return (
            <section class="layout">
                {/* Named slot header with fallback markup */}
                @slot:header({ title: "Task list" }) fallback {
                    <header class="mb-4">
                        <h1 class="text-2xl font-bold text-gray-900">
                            Task list
                        </h1>
                    </header>
                }

                {/* Named slot content with fallback and @if inside */}
                @slot:content({ store: this.props.store, filtered: this.props.filtered, hasTodos: this.props.hasTodos }) fallback {
                    @if (this.props.hasTodos) {
                        <section class="pt-3 border-t border-gray-200 text-sm text-gray-600">
                            <p class="mb-1">
                                Total: {this.props.store.todos.length}, active: {this.props.store.activeCount},
                                completed: {this.props.store.completedCount}
                            </p>
                            <p>Filtered: {this.props.filtered.length}</p>
                        </section>
                    }
                }
            </section>
        );
    }
}
```

Provider rules:

- `@slot:header({ ... })` — declares the named slot `header` and invokes it.
- The `fallback { ... }` block (optional) defines default markup when the slot is not overridden.
- Inside `fallback` you can use `@if`, `@for`, and regular JSX.

#### Slot consumer (override in JSX)

Override a slot in a child component via `@slot.name(...) { ... }` inside JSX children:

```tsx
@View
class TodoApp {
    render() {
        const store = this.store;
        const filtered = this.filteredTodos;

        return (
            <AppLayout
                user={store.user}
                store={store}
                filtered={filtered}
                hasTodos={this.hasTodos}
            >
                {/* Override header slot */}
                @slot.header({ title }) {
                    <header class="mb-5">
                        <h1 class="mb-4 text-2xl font-bold text-gray-900">
                            Tasks ({title})
                        </h1>
                        <TodoInput
                            placeholder="Add task…"
                            onSubmit={(text) => store.add(text)}
                        />
                    </header>
                }

                {/* Override content slot, @if/@for allowed inside */}
                @slot.content({ store, filtered, hasTodos }) {
                    @if (hasTodos) {
                        <section class="pt-3 border-t border-gray-200">
                            <TodoList
                                todos={filtered}
                                onToggle={(id) => store.toggle(id)}
                                onRemove={(id) => store.remove(id)}
                            />
                            <TodoFooter
                                filter={this.filter}
                                activeCount={store.activeCount}
                                completedCount={store.completedCount}
                                summary={store.filterSummary}
                                onFilter={(f) => store.setFilter(f)}
                                onClearCompleted={() => store.clearCompleted()}
                            />
                        </section>
                    }
                }
            </AppLayout>
        );
    }
}
```

Syntax summary:

- `@slot:name({ props }) fallback { FallbackJSX }` — declare and invoke the slot in the provider.
- `@slot.name({ ctx }) { OverrideJSX }` — override the slot in the consumer.
- All directives (`@if`, `@for`, `@empty`) and regular JSX work inside `FallbackJSX` and `OverrideJSX`.
