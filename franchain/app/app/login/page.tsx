import Link from 'next/link'
import React from 'react'

const page = () => {
  return (
    <div>
      login

      <Link href={"/register"}> Register</Link>
    </div>
  )
}

export default page
