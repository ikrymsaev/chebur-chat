import { Link, path, View } from "@helfy/helfy";

@View
export class NavBar {
  @path()
  private pathname?: string;

  render() {
    return (
      <nav class="sidebar-nav">
        <Link
          to="/"
          label="Home"
          class={this.pathname === "/" ? "nav-link nav-link--active" : "nav-link"}
        />
        <Link
          to="/counter"
          label="Counter"
          class={this.pathname === "/counter" ? "nav-link nav-link--active" : "nav-link"}
        />
        <Link
          to="/about"
          label="About"
          class={this.pathname === "/about" ? "nav-link nav-link--active" : "nav-link"}
        />
      </nav>
    );
  }
}
