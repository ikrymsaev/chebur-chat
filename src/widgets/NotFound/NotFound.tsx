import { Link, View } from "@helfy/helfy";

export interface Props {
  pathname?: string;
}

@View
/** Custom 404 page — overrides the fallback RouterView. */
export class NotFound {
  constructor(private readonly props: Props = {}) {}

  render() {
    return (
      <section class="not-found">
        <div class="not-found__code">404</div>
        <h1 class="not-found__title">Oops! Page not found</h1>
        <p class="not-found__text">
          The requested address does not exist or has been moved.
        </p>
        {(this.props.pathname ?? "") && (
          <p class="not-found__path">{this.props.pathname}</p>
        )}
        <Link
          to="/"
          label="Back to home"
          class="btn btn--primary"
        />
      </section>
    );
  }
}
