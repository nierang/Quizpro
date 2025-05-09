declare module 'react-dom/client' {
    import * as ReactDOM from 'react-dom';
    export function createRoot(container: Element | DocumentFragment): ReactDOM.Root;
    export function hydrateRoot(container: Element | DocumentFragment, initialChildren: React.ReactNode): ReactDOM.Root;
  }