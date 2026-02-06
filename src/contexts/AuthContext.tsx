import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { autenticarUsuario, setUsuarioSesion } from '../lib/db';
import { logger } from '../lib/Logger';

export interface User {
  id: number;
  username: string;
  name: string;
  email?: string;
  role: 'admin' | 'empleado';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay una sesión guardada al cargar
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        // Establecer usuario en sesión global CON ROL
        setUsuarioSesion({
          id: userData.id,
          usuario: userData.username,
          nombre: userData.name,
          rol: userData.role
        });
        // Configurar usuario en logger
        logger.setUsuario({
          id: userData.id,
          nombre: userData.name
        });
      } catch (error) {
        console.error('Error al parsear usuario guardado:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const usuarioData = await autenticarUsuario(username, password);
      
      console.log('Login - Usuario autenticado:', usuarioData);
      
      if (usuarioData) {
        const userData: User = {
          id: usuarioData.id,
          username: usuarioData.usuario,
          name: usuarioData.nombre_completo,
          email: usuarioData.email,
          role: usuarioData.rol
        };
        
        console.log('Login - UserData creado:', userData);
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Establecer usuario en sesión global CON ROL
        setUsuarioSesion({
          id: usuarioData.id,
          usuario: usuarioData.usuario,
          nombre: usuarioData.nombre_completo,
          rol: usuarioData.rol
        });
        
        // Configurar usuario en logger
        logger.setUsuario({
          id: usuarioData.id,
          nombre: usuarioData.nombre_completo
        });
        
        console.log('Login - Sesión establecida con rol:', usuarioData.rol);
        
        return { success: true };
      } else {
        return { success: false, error: 'Usuario o contraseña incorrectos' };
      }
    } catch (error) {
      console.error('Error en login:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Limpiar usuario en sesión global
    setUsuarioSesion(null);
    // Limpiar usuario en logger
    logger.setUsuario(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
