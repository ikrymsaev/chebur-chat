import { View } from "@helfy/helfy";
import { ThemeContext, ThemeSync } from "@context/ThemeContext";
import { MainLayout } from "@pages/layouts/MainLayout";
import { Header } from "@widgets/Header/Header";
import { NavBar } from "@widgets/Navbar/Navbar";
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
            @slot.sidebar() {<NavBar />}
            @slot.content() {<AppRouter />}
            @slot.footer() {<Footer />}
          </MainLayout>
        </div>
      </ThemeContext>
    );
  }
}
