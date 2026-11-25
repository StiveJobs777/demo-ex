const ICONS = {
  error: "⛔",
  warning: "⚠️",
  info: "ℹ️",
};

function Notice({ notice, onClose }) {
  if (!notice) {
    return null;
  }

  return (
    <div className={`notice notice-${notice.type}`} role="alert">
      <div className="notice-body">
        <span className="notice-icon">{ICONS[notice.type]}</span>
        <div>
          <strong>{notice.title}</strong>
          <div>{notice.message}</div>
        </div>
      </div>
      <button type="button" className="btn" onClick={onClose}>
        Закрыть
      </button>
    </div>
  );
}

export default Notice;