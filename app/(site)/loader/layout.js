import LoaderLayoutClient from "./LoaderLayoutClient";

export const metadata = {
  title: "Loader | unbanhwid.com",
};

export default function LoaderLayout({ children }) {
  return <LoaderLayoutClient>{children}</LoaderLayoutClient>;
}
