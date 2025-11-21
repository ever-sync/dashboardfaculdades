'use client'

import { useEffect, useState, ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import { useFaculdade } from '@/contexts/FaculdadeContext'

interface ProtectedRouteOptions {
    requiredPermission?: string | string[]
    requireAll?: boolean
    redirectTo?: string
    fallback?: ComponentType
}

/**
 * Higher-order component to protect pages based on permissions
 * 
 * @example
 * const ProtectedPage = withProtectedRoute(MyPage, {
 *   requiredPermission: 'relatorios.export',
 *   redirectTo: '/dashboard'
 * })
 * 
 * @example Multiple permissions
 * const ProtectedPage = withProtectedRoute(MyPage, {
 *   requiredPermission: ['conversas.write', 'conversas.delete'],
 *   requireAll: true
 * })
 */
export function withProtectedRoute<P extends object>(
    Component: ComponentType<P>,
    options: ProtectedRouteOptions = {}
) {
    const {
        requiredPermission,
        requireAll = false,
        redirectTo = '/dashboard',
        fallback: FallbackComponent
    } = options

    return function ProtectedRoute(props: P) {
        const router = useRouter()
        const { faculdadeSelecionada } = useFaculdade()
        const [isAuthorized, setIsAuthorized] = useState(false)
        const [isLoading, setIsLoading] = useState(true)

        useEffect(() => {
            const checkPermission = async () => {
                // If no permission required, allow access
                if (!requiredPermission) {
                    setIsAuthorized(true)
                    setIsLoading(false)
                    return
                }

                if (!faculdadeSelecionada) {
                    setIsAuthorized(false)
                    setIsLoading(false)
                    router.push(redirectTo)
                    return
                }

                try {
                    const permissions = Array.isArray(requiredPermission)
                        ? requiredPermission
                        : [requiredPermission]

                    // Get user permissions from API
                    const response = await fetch(
                        `/api/rbac/user-permissions?faculdade_id=${faculdadeSelecionada.id}`
                    )

                    if (!response.ok) {
                        setIsAuthorized(false)
                        setIsLoading(false)
                        router.push(redirectTo)
                        return
                    }

                    const { permissions: userPermissions } = await response.json()
                    const userPermissionNames = userPermissions.map((p: any) => p.nome)

                    // Check if user has required permissions
                    let hasRequiredPermission = false

                    if (requireAll) {
                        // User must have ALL permissions
                        hasRequiredPermission = permissions.every(perm =>
                            userPermissionNames.includes(perm)
                        )
                    } else {
                        // User must have ANY permission
                        hasRequiredPermission = permissions.some(perm =>
                            userPermissionNames.includes(perm)
                        )
                    }

                    if (!hasRequiredPermission) {
                        router.push(redirectTo)
                        setIsAuthorized(false)
                    } else {
                        setIsAuthorized(true)
                    }
                } catch (error) {
                    console.error('Error checking permission:', error)
                    router.push(redirectTo)
                    setIsAuthorized(false)
                } finally {
                    setIsLoading(false)
                }
            }

            checkPermission()
        }, [requiredPermission, faculdadeSelecionada, router, redirectTo, requireAll])

        if (isLoading) {
            if (FallbackComponent) {
                return <FallbackComponent {...props} />
            }

            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            )
        }

        if (!isAuthorized) {
            if (FallbackComponent) {
                return <FallbackComponent {...props} />
            }

            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
                        <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
                    </div>
                </div>
            )
        }

        return <Component {...props} />
    }
}

/**
 * Component version of protected route
 */
interface ProtectedRouteComponentProps extends ProtectedRouteOptions {
    children: React.ReactNode
}

export function ProtectedRoute({
    children,
    requiredPermission,
    requireAll = false,
    redirectTo = '/dashboard',
    fallback: FallbackComponent
}: ProtectedRouteComponentProps) {
    const router = useRouter()
    const { faculdadeSelecionada } = useFaculdade()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkPermission = async () => {
            if (!requiredPermission) {
                setIsAuthorized(true)
                setIsLoading(false)
                return
            }

            if (!faculdadeSelecionada) {
                setIsAuthorized(false)
                setIsLoading(false)
                router.push(redirectTo)
                return
            }

            try {
                const permissions = Array.isArray(requiredPermission)
                    ? requiredPermission
                    : [requiredPermission]

                const response = await fetch(
                    `/api/rbac/user-permissions?faculdade_id=${faculdadeSelecionada.id}`
                )

                if (!response.ok) {
                    setIsAuthorized(false)
                    setIsLoading(false)
                    router.push(redirectTo)
                    return
                }

                const { permissions: userPermissions } = await response.json()
                const userPermissionNames = userPermissions.map((p: any) => p.nome)

                let hasRequiredPermission = false

                if (requireAll) {
                    hasRequiredPermission = permissions.every(perm =>
                        userPermissionNames.includes(perm)
                    )
                } else {
                    hasRequiredPermission = permissions.some(perm =>
                        userPermissionNames.includes(perm)
                    )
                }

                if (!hasRequiredPermission) {
                    router.push(redirectTo)
                    setIsAuthorized(false)
                } else {
                    setIsAuthorized(true)
                }
            } catch (error) {
                console.error('Error checking permission:', error)
                router.push(redirectTo)
                setIsAuthorized(false)
            } finally {
                setIsLoading(false)
            }
        }

        checkPermission()
    }, [requiredPermission, faculdadeSelecionada, router, redirectTo, requireAll])

    if (isLoading) {
        if (FallbackComponent) {
            return <FallbackComponent />
        }

        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    if (!isAuthorized) {
        if (FallbackComponent) {
            return <FallbackComponent />
        }

        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
                    <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
