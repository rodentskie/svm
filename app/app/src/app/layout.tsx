import { Provider } from '@svm/components/provider';

export const metadata = {
  title: 'Practera Status',
  description: 'Monitor the status of Practera and 3rd party services',
};

export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props;
  return (
    <html suppressHydrationWarning>
      <body>
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}
