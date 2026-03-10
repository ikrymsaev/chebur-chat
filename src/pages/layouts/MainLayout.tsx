import { View } from "@helfy/helfy";

@View
export class MainLayout {
  render() {
    return (
      <div class="layout">
        <header class="header">
          @slot:header()
        </header>
        <div class="layout__body">
          <main class="main">
            <div class="main__content">
              @slot:content()
            </div>
          </main>
        </div>
        <footer class="footer">
          @slot:footer() fallback {
            <span>© 2026</span>
          }
        </footer>
      </div>
    );
  }
}
