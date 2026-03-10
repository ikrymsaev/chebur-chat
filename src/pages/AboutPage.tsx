import { View } from "@helfy/helfy";

@View
export class AboutPage {
  render() {
    return (
      <div class="page">
        <h1>About</h1>
        <p>
          This is a Helfy application with routing, slots, and theme context.
        </p>
        <p>
          Helfy is a declarative framework with decorators, reactive state, and built-in TypeScript support.
        </p>
      </div>
    );
  }
}
