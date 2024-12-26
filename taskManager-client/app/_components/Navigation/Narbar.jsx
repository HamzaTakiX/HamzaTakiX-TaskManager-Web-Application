import Link from "next/link";
import { SiTask } from "react-icons/si";
function Narbar() {
  return (
    <header className="bg-white">
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div className="flex h-16 items-center justify-between">
        <div className="flex md:flex md:items-center md:gap-12">
          <a className=" text-primeColor flex justify-center items-center" href="#">
            <span className="sr-only">Home</span>
            <SiTask className="h-10 w-10" />
            <h1 className="ml-2 font-bold" >Star Company</h1>
          </a>
        </div>
  
        <div className="md:flex md:items-center md:gap-12">
          <nav aria-label="Global" className="hidden md:block">
            <ul className="flex items-center gap-6 text-sm">
              <li>
                <a className="text-gray-500 transition hover:text-gray-500/75" href="#"> Guide </a>
              </li>

              <li>
                <a className="text-gray-500 transition hover:text-gray-500/75" href="#"> Support </a>
              </li>
              <li>
                <a className="text-gray-500 transition hover:text-gray-500/75" href="#"> Contact Us </a>
              </li>
            </ul>
          </nav>
  
          <div className="flex items-center gap-4">
            <div className="sm:flex sm:gap-4">
              <Link
                className="rounded-md bg-primeColor px-5 py-2.5 text-sm font-medium text-white shadow"
                href="/auth/login"
              >
                Login
              </Link>
  
              <div className="hidden sm:flex">
                <Link
                  className="rounded-md bg-gray-100 px-5 py-2.5 text-sm font-medium text-primeColor shadow"
                  href="/auth/register"
                >
                  Register
                </Link>
              </div>
            </div>
  
            <div className="block md:hidden">
              <button className="rounded bg-gray-100 p-2 text-gray-600 transition hover:text-gray-600/75">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
  )
}

export default Narbar