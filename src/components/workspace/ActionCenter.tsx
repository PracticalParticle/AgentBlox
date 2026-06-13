import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function ActionCenter({ children }: Props) {
  return <section className="action-center">{children}</section>;
}
