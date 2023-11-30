import React, { useCallback, useEffect } from "react";
import AppRouter from "./src/router/AppRouter";
import stores, { storesContext } from "./src/mobx/storesIndex";

export default function ContextWrapper() {

  return (
      <storesContext.Provider value={stores}>
        <ChildComponent />
      </storesContext.Provider>
  );
}
