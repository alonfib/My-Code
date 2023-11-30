import React, { useCallback, useEffect } from "react";
import stores, { storesContext } from "./stores";

export default function ContextWrapper({ children }) {

  return (
      <storesContext.Provider value={stores}>
        {children}
      </storesContext.Provider>
  );
}
