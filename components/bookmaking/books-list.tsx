// src/components/bookmaking/books-list.tsx
'use client'

import { useState, useEffect } from 'react'
import { Book } from '@/app/types/bookmaking'

interface BooksListProps {
  onBookSelect: (book: Book) => void
  selectedBook: Book | null
}

export default function BooksList({ onBookSelect, selectedBook }: BooksListProps) {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBooks()
  }, [])

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/bookmaking/books')
      if (response.ok) {
        const booksData: Book[] = await response.json()
        setBooks(booksData)
      }
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading books...</div>
  }

  return (
    <div className="space-y-4">
      {books.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No books created yet.</p>
          <p className="text-sm text-gray-400">Create your first book to get started.</p>
        </div>
      ) : (
        books.map((book) => (
          <div
            key={book.id}
            className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedBook?.id === book.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
            onClick={() => onBookSelect(book)}
          >
            <h3 className="font-semibold text-lg text-gray-900">{book.title}</h3>
            {book.description && (
              <p className="text-gray-600 text-sm mt-1">{book.description}</p>
            )}
            <div className="flex justify-between items-center mt-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                book.status === 'ACTIVE' 
                  ? 'bg-green-100 text-green-800'
                  : book.status === 'SETTLED'
                  ? 'bg-gray-100 text-gray-800'
                  : book.status === 'CANCELLED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {book.status.toLowerCase()}
              </span>
              <div className="flex space-x-4 text-sm text-gray-500">
                <span>{book.events.length} events</span>
                <span>{new Date(book.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}