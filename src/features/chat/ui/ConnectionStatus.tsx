import { View } from "@helfy/helfy";
import type { ConnectionState } from "@interfaces/chat";

interface Props {
  state: ConnectionState 
}


const labels: Record<ConnectionState, string> = {
  idle: "Не подключено",
  connecting: "Подключение...",
  connected: "Подключено",
  disconnected: "Отключено",
  error: "Ошибка",
};

@View
export class ConnectionStatus {
  constructor(private readonly props: Props) {}

  render() {
    return (
      <div class="connection-status" data-state={this.props.state}>
        <span class="connection-status__indicator" />
        {labels[this.props.state]}
      </div>
    );
  }
}
