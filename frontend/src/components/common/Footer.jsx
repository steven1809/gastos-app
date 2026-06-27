const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-6 mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            Creado por <span className="font-semibold text-gray-900 dark:text-white">Javier Steven Diaz Gongora</span>
          </p>
          <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-6 text-xs text-gray-500 dark:text-gray-400">
            <p>© {new Date().getFullYear()} Todos los derechos reservados</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
