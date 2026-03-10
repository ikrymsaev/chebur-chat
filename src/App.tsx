import { View } from "@helfy/helfy";
import { ThemeContext, ThemeSync } from "@context/ThemeContext";
import { MainLayout } from "@pages/layouts/MainLayout";
import { Header } from "@widgets/Header/Header";
import { Footer } from "@widgets/Footer/Footer";
import { AppRouter } from "@pages/_router";

@View
export class App {
  render() {
    return (
      <ThemeContext>
        <ThemeSync />
        <div class="app">
          <MainLayout>
            @slot.header() {<Header />}
            @slot.content() {<AppRouter />}
            @slot.footer() {<Footer />}
          </MainLayout>
        </div>
      </ThemeContext>
    );
  }
}
