import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/react'
import { apiCall } from '../lib/api'

const UserContext = createContext(null)

export const useAppUser = () => {
    const ctx = useContext(UserContext)
    if (!ctx) throw new Error('useAppUser must be used within <UserProvider>')
    return ctx
}

export const UserProvider = ({ children }) => {
    const { getToken, isSignedIn, isLoaded } = useAuth()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchUser = useCallback(async () => {
        if (!isLoaded || !isSignedIn) {
            setUser(null)
            setLoading(false)
            return
        }
        try {
            const token = await getToken()
            const data = await apiCall('/api/user/me', {}, token)
            setUser(data)
        } catch (err) {
            console.error('Failed to fetch user:', err)
            setUser(null)
        } finally {
            setLoading(false)
        }
    }, [getToken, isSignedIn, isLoaded])

    useEffect(() => {
        fetchUser()
    }, [fetchUser])

    // Call refreshUser() after any credit-consuming action
    const refreshUser = useCallback(() => fetchUser(), [fetchUser])

    return (
        <UserContext.Provider value={{ user, loading, refreshUser }}>
            {children}
        </UserContext.Provider>
    )
}
