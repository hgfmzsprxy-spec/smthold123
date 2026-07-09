"use client";

import { createContext, useContext } from "react";

const NavAuthBootstrapContext = createContext(null);

export function NavAuthBootstrap({ profile, children }) {
  return <NavAuthBootstrapContext.Provider value={profile}>{children}</NavAuthBootstrapContext.Provider>;
}

export function useNavAuthBootstrap() {
  return useContext(NavAuthBootstrapContext);
}
