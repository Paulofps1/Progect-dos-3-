import { Component, type ReactNode } from 'react';

// Se alguma tela quebrar, mostra o erro e um botão de recarregar em vez da tela em
// branco. O texto do erro ajuda a corrigir (manda o print).
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full bg-card rounded-3xl border border-border p-6 text-center space-y-4">
          <p className="text-lg font-semibold text-foreground">Algo deu errado nesta tela</p>
          <p className="text-xs text-muted-foreground break-words">
            {error.message} · versão {__APP_VERSION__}
          </p>
          <button
            onClick={() => location.reload()}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold"
          >
            Recarregar
          </button>
          <button onClick={() => (location.href = '/dashboard')} className="text-sm text-muted-foreground underline">
            Voltar para Hoje
          </button>
        </div>
      </div>
    );
  }
}
