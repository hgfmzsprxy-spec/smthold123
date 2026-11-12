import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export default function ConnectLoaderLayout({ children }) {
  return <div className={montserrat.className}>{children}</div>;
}
