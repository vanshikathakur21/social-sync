'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Download, Sparkles, Twitter } from 'lucide-react'

const formSchema = z.object({
  age: z.string().min(1, 'Age is required').refine(
    (val) => {
      const num = parseInt(val)
      return !isNaN(num) && num >= 1 && num <= 120
    },
    'Age must be between 1 and 120'
  ),
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  interests: z.string().min(1, 'Interests are required'),
  tone: z.string().min(1, 'Tone is required'),
  perspective: z.string().min(1, 'Perspective is required'),
  hookline: z.string().min(1, 'Hook line is required'),
})

type FormData = z.infer<typeof formSchema>

export default function SocialSyncForm() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedPost, setGeneratedPost] = useState('')
  const [savedData, setSavedData] = useState('')

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: '',
      country: '',
      state: '',
      interests: '',
      tone: '',
      perspective: '',
      hookline: '',
    },
  })

  const formatDataForDisplay = (data: FormData) => {
    const timestamp = new Date().toLocaleString()
    return `Social Post Data - Saved on ${timestamp}
============================================

Age: ${data.age}
Country: ${data.country}
State: ${data.state}
Interests: ${data.interests}
Tone: ${data.tone}
Perspective: ${data.perspective}
Hook Line: ${data.hookline}

Formatted Prompt (for AI):
Generate a ${data.tone} social media post for a ${data.age}-year-old from ${data.state}, ${data.country}, interested in ${data.interests}. The perspective should be ${data.perspective}. Start with: "${data.hookline}"

============================================`
  }

  const saveData = async (data: FormData) => {
    setIsSaving(true)
    try {
      const formattedData = formatDataForDisplay(data)
      setSavedData(formattedData)

      // Create and download file
      const blob = new Blob([formattedData], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'data.txt'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Data saved successfully and downloaded as data.txt!')
    } catch (error) {
      console.error('Error saving data:', error)
      toast.error('An error occurred while saving the data. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const generateAIPost = async (data: FormData) => {
    setIsGenerating(true)
    try {
      const response = await fetch('/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate AI post from backend.')
      }

      const result = await response.json()
      const generatedText = result.post

      if (generatedText) {
        setGeneratedPost(generatedText)
        toast.success('AI Post generated successfully!')
      } else {
        setGeneratedPost('No post generated. Please try again.')
        toast.error('Received empty response from AI.')
      }
    } catch (error) {
      console.error('Error generating AI post:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`An error occurred: ${errorMessage}`)
      setGeneratedPost(`Error generating post: ${errorMessage}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const postToTwitter = async () => {
    if (!generatedPost || generatedPost.trim() === '') {
      toast.error('No post to share. Please generate a post first.')
      return
    }

    setIsPosting(true)
    try {
      const response = await fetch('/post-to-twitter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post: generatedPost }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to post to Twitter.')
      }

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        if (result.tweet_url) {
          toast.success(`Tweet posted! View it at: ${result.tweet_url}`)
        }
      } else {
        toast.error(result.error || 'Failed to post to Twitter.')
      }
    } catch (error) {
      console.error('Error posting to Twitter:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`An error occurred: ${errorMessage}`)
    } finally {
      setIsPosting(false)
    }
  }

  const onSubmit = (data: FormData) => {
    saveData(data)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">Social Post Generator</h1>
          <p className="text-slate-600">Create engaging social media content with AI</p>
        </div>

        {/* Main Form Card */}
        <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-8">
            <CardTitle className="text-2xl text-slate-800">Content Details</CardTitle>
            <CardDescription className="text-slate-600">
              Fill in your details to generate personalized social media content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Age */}
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-slate-700 font-medium">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="1"
                    max="120"
                    placeholder="Enter your age"
                    className="border-slate-200 focus:border-slate-400 bg-white"
                    {...form.register('age')}
                  />
                  {form.formState.errors.age && (
                    <p className="text-sm text-red-500">{form.formState.errors.age.message}</p>
                  )}
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-slate-700 font-medium">Country</Label>
                  <Input
                    id="country"
                    placeholder="Enter your country"
                    className="border-slate-200 focus:border-slate-400 bg-white"
                    {...form.register('country')}
                  />
                  {form.formState.errors.country && (
                    <p className="text-sm text-red-500">{form.formState.errors.country.message}</p>
                  )}
                </div>

                {/* State */}
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-slate-700 font-medium">State</Label>
                  <Input
                    id="state"
                    placeholder="Enter your state"
                    className="border-slate-200 focus:border-slate-400 bg-white"
                    {...form.register('state')}
                  />
                  {form.formState.errors.state && (
                    <p className="text-sm text-red-500">{form.formState.errors.state.message}</p>
                  )}
                </div>

                {/* Interests */}
                <div className="space-y-2">
                  <Label htmlFor="interests" className="text-slate-700 font-medium">Interests</Label>
                  <Input
                    id="interests"
                    placeholder="e.g., Technology, Travel, Food"
                    className="border-slate-200 focus:border-slate-400 bg-white"
                    {...form.register('interests')}
                  />
                  {form.formState.errors.interests && (
                    <p className="text-sm text-red-500">{form.formState.errors.interests.message}</p>
                  )}
                </div>

                {/* Tone */}
                <div className="space-y-2">
                  <Label htmlFor="tone" className="text-slate-700 font-medium">Tone</Label>
                  <Select onValueChange={(value) => form.setValue('tone', value)}>
                    <SelectTrigger className="border-slate-200 focus:border-slate-400 bg-white">
                      <SelectValue placeholder="Select a tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Friendly">Friendly</SelectItem>
                      <SelectItem value="Inspirational">Inspirational</SelectItem>
                      <SelectItem value="Funny">Funny</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.tone && (
                    <p className="text-sm text-red-500">{form.formState.errors.tone.message}</p>
                  )}
                </div>

                {/* Perspective */}
                <div className="space-y-2">
                  <Label htmlFor="perspective" className="text-slate-700 font-medium">Perspective</Label>
                  <Select onValueChange={(value) => form.setValue('perspective', value)}>
                    <SelectTrigger className="border-slate-200 focus:border-slate-400 bg-white">
                      <SelectValue placeholder="Select a perspective" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First Person">First Person</SelectItem>
                      <SelectItem value="General Trivia">General Trivia</SelectItem>
                      <SelectItem value="Reflective">Reflective</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.perspective && (
                    <p className="text-sm text-red-500">{form.formState.errors.perspective.message}</p>
                  )}
                </div>
              </div>

              {/* Hook Line */}
              <div className="space-y-2">
                <Label htmlFor="hookline" className="text-slate-700 font-medium">Hook Line</Label>
                <Input
                  id="hookline"
                  placeholder="Enter an engaging opening line"
                  className="border-slate-200 focus:border-slate-400 bg-white"
                  {...form.register('hookline')}
                />
                {form.formState.errors.hookline && (
                  <p className="text-sm text-red-500">{form.formState.errors.hookline.message}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-slate-700 hover:bg-slate-800 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Save Data
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={() => form.handleSubmit(generateAIPost)()}
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate AI Post
                    </>
                  )}
                </Button>

                {generatedPost && (
                  <Button
                    type="button"
                    onClick={postToTwitter}
                    disabled={isPosting}
                    className="bg-sky-500 hover:bg-sky-600 text-white"
                  >
                    {isPosting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Twitter className="mr-2 h-4 w-4" />
                        Post to Twitter
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Generated Post Preview */}
        {generatedPost && (
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">AI Generated Post</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={generatedPost}
                readOnly
                className="min-h-[120px] border-slate-200 bg-slate-50 text-slate-800"
                placeholder="Your AI-generated post will appear here..."
              />
            </CardContent>
          </Card>
        )}

        {/* Saved Data Preview */}
        {savedData && (
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">Saved Data Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={savedData}
                readOnly
                className="min-h-[200px] border-slate-200 bg-slate-50 text-slate-800 font-mono text-sm"
                placeholder="Your saved data will appear here..."
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}