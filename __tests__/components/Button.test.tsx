
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'
import '@testing-library/jest-dom'

describe('Button Component', () => {
    it('deve renderizar o botão com o texto correto', () => {
        render(<Button>Clique aqui</Button>)
        expect(screen.getByText('Clique aqui')).toBeInTheDocument()
    })

    it('deve chamar a função onClick quando clicado', () => {
        const handleClick = jest.fn()
        render(<Button onClick={handleClick}>Clique aqui</Button>)
        fireEvent.click(screen.getByText('Clique aqui'))
        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('deve aplicar a classe de variante correta', () => {
        render(<Button variant="danger">Perigo</Button>)
        expect(screen.getByText('Perigo')).toBeInTheDocument()
    })

    it('deve estar desabilitado quando disabled é true', () => {
        render(<Button disabled>Desabilitado</Button>)
        expect(screen.getByText('Desabilitado')).toBeDisabled()
    })
})
