import React from "react";

export const Footer: React.FC = () => (
  <footer className="w-full bg-gray-100 py-6 text-center text-sm text-gray-500">
    &copy; {new Date().getFullYear()} NeoChyrp. Inspired by Chyrp Lite. All rights reserved.
  </footer>
);
export default Footer;