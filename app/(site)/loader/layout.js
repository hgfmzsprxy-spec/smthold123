import LoaderLayoutClient from "./LoaderLayoutClient";

export const metadata = {
  title: "Loader | phantom-cheats.com",
};

export default function LoaderLayout({ children }) {
  return <LoaderLayoutClient>{children}</LoaderLayoutClient>;
}
