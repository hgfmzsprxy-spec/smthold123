import LoaderLayoutClient from "./LoaderLayoutClient";

export const metadata = {
  title: "Loader | phantom-cheat.com",
};

export default function LoaderLayout({ children }) {
  return <LoaderLayoutClient>{children}</LoaderLayoutClient>;
}
