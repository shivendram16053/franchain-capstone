"use client";

import EditAgreement from '@/components/Edit'
import { useParams } from 'next/navigation'
import React from 'react'

const page = () => {
      const { id } = useParams() || {};
      const idString = id ? String(id) : '';
    
  return (
    <div>
      <EditAgreement params={{ id: idString }}/>
    </div>
  )
}

export default page
