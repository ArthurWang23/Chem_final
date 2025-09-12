// wsBridge.ts - 统一 WebSocket 桥接器（父应用）
// 作用：父应用持有到 /api/devices/realtime 的唯一连接，iframe 子页面通过 postMessage 复用该连接

type ChildInfo = {
  id: string;
  source: Window;
  origin: string;
  subscriptions: Set<string>;
};

const children = new Map<string, ChildInfo>();
let childSeq = 0;

// 允许的 iframe 来源（安全）
const allowedOrigins = (() => {
  const list: string[] = [window.location.origin];
  const env = import.meta.env?.VITE_IFRAME_ALLOWED_ORIGINS as string | undefined;
  if (env) {
    env.split(',').map(s => s.trim()).filter(Boolean).forEach(o => list.push(o));
  }
  return new Set(list);
})();

// 简单节流：某些高频事件（按 childId+type）
const lastEmitAt = new Map<string, number>();
const throttleMsByType: Record<string, number> = {
  hardwareStatus: 500 // 2Hz
};

function shouldEmit(childId: string, type: string) {
  const key = `${childId}::${type}`;
  const now = Date.now();
  const limit = throttleMsByType[type] ?? 0;
  if (limit <= 0) return true;
  const last = lastEmitAt.get(key) ?? 0;
  if (now - last >= limit) {
    lastEmitAt.set(key, now);
    return true;
  }
  return false;
}

// 动态加载父应用的设备 WS 管理器（共用现有实现）
let deviceManagerPromise: Promise<any> | null = null;
function getDeviceManager(): Promise<any> {
  if (!deviceManagerPromise) {
    deviceManagerPromise = import('./sharedConnectionManager.js').then(mod => mod.default || mod);
  }
  return deviceManagerPromise;
}

// 将事件分发给订阅该 type 的子页面
function broadcastToChildren(message: { type: string; data?: any; correlationId?: string }) {
  const payload = {
    kind: 'WS_EVENT',
    type: message.type,
    data: message.data,
    correlationId: message.correlationId
  };
  children.forEach(child => {
    if (!child.subscriptions.has(message.type)) return;
    if (!shouldEmit(child.id, message.type)) return;
    try {
      child.source.postMessage(payload, child.origin);
    } catch (e) {
      console.warn('[wsBridge] postMessage failed to child', child.id, e);
    }
  });
}

// 订阅父应用的设备 WS 推送
getDeviceManager().then(dm => {
  // 标准消息分发
  dm.on?.('message', (data: any) => {
    if (!data || !data.type) return;
    switch (data.type) {
      case 'hardwareStatus':
      case 'devices':
      case 'parameterUpdateResults':
      case 'commandResult':
        broadcastToChildren(data);
        break;
      default:
        // 非关键类型按需扩展
        break;
    }
  });

  // 可选：连接/断开/错误等事件（这里不主动广播，子页面会在握手后主动拉取状态）
  dm.on?.('connected', () => {});
  dm.on?.('disconnected', () => {});
  dm.on?.('error', () => {});
});

// 处理来自子页面的消息
window.addEventListener('message', async (event: MessageEvent) => {
  const { origin, source, data } = event;
  if (!source || typeof (source as Window).postMessage !== 'function') return;
  if (!data || typeof data !== 'object') return;

  if (!allowedOrigins.has(origin)) {
    // 不在白名单，忽略
    return;
  }

  switch (data.kind) {
    case 'BRIDGE_HELLO': {
      const id = `child-${++childSeq}`;
      const info: ChildInfo = {
        id,
        source: source as Window,
        origin,
        subscriptions: new Set()
      };
      children.set(id, info);
      try {
        (source as Window).postMessage({ kind: 'BRIDGE_ACK', childId: id }, origin);
      } catch {}
      return;
    }

    case 'WS_SUBSCRIBE': {
      const { childId, types = [] } = data;
      const info = childId ? children.get(childId) : null;
      if (!info) return;
      types.forEach((t: string) => info.subscriptions.add(t));
      return;
    }

    case 'WS_UNSUBSCRIBE': {
      const { childId, types = [] } = data;
      const info = childId ? children.get(childId) : null;
      if (!info) return;
      types.forEach((t: string) => info.subscriptions.delete(t));
      return;
    }

    case 'WS_SEND': {
      const { type, payload, correlationId } = data;
      const dm = await getDeviceManager();
      // 直接复用父应用的 send 能力
      dm.send?.({ type, payload, correlationId });
      return;
    }

    case 'WS_UNSUBSCRIBE_ALL': {
      const { childId } = data;
      const info = childId ? children.get(childId) : null;
      if (!info) return;
      info.subscriptions.clear();
      return;
    }

    default:
      // ignore unknown
      return;
  }
});