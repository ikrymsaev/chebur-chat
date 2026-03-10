import { View } from "@helfy/helfy";

@View
export class HomePage {
  render() {
    return (
      <div class="page">
        <h1>Welcome to Helfy</h1>
        <p>
          Welcome to Helfy — a modern TypeScript framework for web applications.
        </p>
        <p>
          Edit <code>src/App.tsx</code> and save the file — changes will appear automatically.
        </p>
        <h2>Quick Start</h2>
        <p>
          Use the sidebar for navigation. Try the Counter page to see reactivity in action and toggle the theme in the top-right corner.
        </p>
      </div>
    );
  }
}
