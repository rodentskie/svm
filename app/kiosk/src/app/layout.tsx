import { Provider } from '@svm/components/provider';

export const metadata = {
  title: 'SVM',
  description: 'Smart Vending Machine Management System',
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
