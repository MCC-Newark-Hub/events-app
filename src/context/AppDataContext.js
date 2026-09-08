import { createContext, useContext } from "react";

export const AppDataContext = createContext(null);

export const useAppDataContext = () => useContext(AppDataContext);
