import { ThemeToggle } from "@context/ThemeContext";
import { Link, path, View } from "@helfy/helfy";

@View
export class Header {
  @path()
  private pathname?: string;

  render() {
    return (
      <div class="header__inner">
        <Link to="/" label="Helfy" class="header__logo" />
        <nav class="nav">
          <Link
            to="/"
            label="Home"
            class={this.pathname === "/" ? "nav-link--active" : ""}
          />
          <Link
            to="/counter"
            label="Counter"
            class={this.pathname === "/counter" ? "nav-link--active" : ""}
          />
          <Link
            to="/about"
            label="About"
            class={this.pathname === "/about" ? "nav-link--active" : ""}
          />
        </nav>
        <ThemeToggle />
      </div>
    );
  }
}