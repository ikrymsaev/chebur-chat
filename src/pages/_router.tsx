import { RouterView, View } from "@helfy/helfy";
import { NotFound } from "@widgets/NotFound/NotFound";

@View
export class AppRouter {
  render() {
    return (
      <RouterView>
        @slot.notFound({ pathname }) {
          <NotFound pathname={pathname} />
        }
      </RouterView>
    );
  }
}