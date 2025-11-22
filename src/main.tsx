import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, defaultSystem, Toast } from '@chakra-ui/react'
import { Toaster, createToaster } from '@chakra-ui/react'
import './index.css'
import App from './App.tsx'

export const toaster = createToaster({
  placement: 'top-end',
  overlap: true,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider value={defaultSystem}>
      <App />
      <Toaster toaster={toaster}>
        {(toast) => (
          <Toast.Root minWidth="350px">
            <Toast.Title>{toast.title}</Toast.Title>
            {toast.description && <Toast.Description>{toast.description}</Toast.Description>}
            <Toast.CloseTrigger />
          </Toast.Root>
        )}
      </Toaster>
    </ChakraProvider>
  </StrictMode>,
)
