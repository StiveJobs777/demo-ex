function LoginPage({ loginInput, onLoginInputChange, onSubmit, onBack, users }) {
  return (
    <div className="panel login-box">
      <div className="page-bar">
        <h1>Авторизация</h1>
        <button type="button" className="btn" onClick={onBack}>
          ← Назад
        </button>
      </div>

      <form onSubmit={onSubmit}>
        <label htmlFor="login-input">
          <strong>Логин пользователя:</strong>
        </label>
        <input
          id="login-input"
          className="input"
          value={loginInput}
          onChange={(event) => onLoginInputChange(event.target.value)}
          placeholder="Например: client1, manager1, admin1"
          autoFocus
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 12 }}
        >
          Войти
        </button>
      </form>

      <div className="field-hint">Подсказка (учебный стенд), доступные логины:</div>
      <div className="hint-logins">
        {users.map((item) => (
          <button
            key={item.id}
            type="button"
            className="btn"
            onClick={() => onLoginInputChange(item.login)}
          >
            {item.login}
          </button>
        ))}
      </div>
    </div>
  );
}

export default LoginPage;