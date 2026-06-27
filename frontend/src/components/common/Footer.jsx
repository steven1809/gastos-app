const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-6 mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            Creado por <span className="font-semibold text-gray-900 dark:text-white">Javier Steven Diaz Gongora</span>
          </p>
          <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-6 text-xs text-gray-500 dark:text-gray-400">
            <p>📧 <a href="mailto:iansteven1820@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">iansteven1820@gmail.com</a></p>
            <p>📞 <a href="tel:3014965444" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">3014965444</a></p>
            <p>© {new Date().getFullYear()} Todos los derechos reservados</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
