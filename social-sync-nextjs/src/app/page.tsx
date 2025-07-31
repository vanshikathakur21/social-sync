'use client'

import { useState, useEffect } from 'react'
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
import { Loader2, Save, Sparkles, Twitter, Trash2 } from 'lucide-react'

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
  const [postingStage, setPostingStage] = useState('')
  const [postingLogs, setPostingLogs] = useState<string[]>([])
  const [lastPostResult, setLastPostResult] = useState<{success: boolean, message: string, tweet_url?: string} | null>(null)

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

  // Load saved data on component mount
  useEffect(() => {
    const savedFormData = loadDataFromLocalStorage()
    const savedDisplayData = loadSavedDisplayData()
    
    if (savedFormData) {
      // Populate form fields with saved data
      form.reset(savedFormData)
      toast.success('Previously saved data loaded!')
    }
    
    if (savedDisplayData) {
      // Populate saved data preview
      setSavedData(savedDisplayData)
    }
  }, [form])

  // Auto-save functionality - save data whenever form values change
  useEffect(() => {
    const subscription = form.watch((data) => {
      // Only auto-save if all required fields are filled
      const hasAllFields = data.age && data.country && data.state && 
                          data.interests && data.tone && data.perspective && data.hookline
      
      if (hasAllFields) {
        // Auto-save silently without showing toast
        saveDataToLocalStorage(data as FormData)
      }
    })
    
    return () => subscription.unsubscribe()
  }, [form])

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

  // Save data to localStorage
  const saveDataToLocalStorage = (data: FormData) => {
    try {
      localStorage.setItem('socialSyncFormData', JSON.stringify(data))
      const formattedData = formatDataForDisplay(data)
      localStorage.setItem('socialSyncSavedData', formattedData)
      return true
    } catch (error) {
      console.error('Error saving to localStorage:', error)
      return false
    }
  }

  // Load data from localStorage
  const loadDataFromLocalStorage = (): FormData | null => {
    try {
      const savedData = localStorage.getItem('socialSyncFormData')
      if (savedData) {
        return JSON.parse(savedData)
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    }
    return null
  }

  // Load saved display data from localStorage
  const loadSavedDisplayData = (): string => {
    try {
      const savedDisplayData = localStorage.getItem('socialSyncSavedData')
      return savedDisplayData || ''
    } catch (error) {
      console.error('Error loading saved display data:', error)
      return ''
    }
  }

  const saveData = async (data: FormData) => {
    setIsSaving(true)
    try {
      const formattedData = formatDataForDisplay(data)
      setSavedData(formattedData)

      // Save to localStorage instead of downloading file
      const saveSuccess = saveDataToLocalStorage(data)
      
      if (saveSuccess) {
        toast.success('Data saved successfully to browser storage!')
      } else {
        throw new Error('Failed to save to browser storage')
      }
    } catch (error) {
      console.error('Error saving data:', error)
      toast.error('An error occurred while saving the data. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const clearSavedData = () => {
    try {
      localStorage.removeItem('socialSyncFormData')
      localStorage.removeItem('socialSyncSavedData')
      setSavedData('')
      form.reset({
        age: '',
        country: '',
        state: '',
        interests: '',
        tone: '',
        perspective: '',
        hookline: '',
      })
      toast.success('Saved data cleared successfully!')
    } catch (error) {
      console.error('Error clearing saved data:', error)
      toast.error('An error occurred while clearing the data.')
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

  const addPostingLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setPostingLogs(prev => [...prev, `[${timestamp}] ${message}`])
    
    // Auto-scroll to bottom of logs after a brief delay
    setTimeout(() => {
      const logContainer = document.getElementById('posting-logs')
      if (logContainer) {
        logContainer.scrollTop = logContainer.scrollHeight
      }
    }, 100)
  }

  const postToTwitter = async () => {
    if (!generatedPost || generatedPost.trim() === '') {
      toast.error('No post to share. Please generate a post first.')
      return
    }

    // Reset states
    setIsPosting(true)
    setPostingLogs([])
    setLastPostResult(null)
    
    try {
      // Step 1: Validation
      setPostingStage('Validating post content...')
      addPostingLog('Starting Twitter posting process')
      addPostingLog(`Post length: ${generatedPost.length} characters`)
      
      if (generatedPost.length > 280) {
        addPostingLog('⚠️ Post will be truncated to 280 characters')
      }

      // Step 2: Making API request
      setPostingStage('Connecting to Twitter API...')
      addPostingLog('Sending request to Twitter API')
      
      const response = await fetch('/post-to-twitter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post: generatedPost }),
      })

      // Step 3: Processing response
      setPostingStage('Processing Twitter response...')
      addPostingLog(`Received response with status: ${response.status}`)

      let result
      try {
        result = await response.json()
        addPostingLog('Successfully parsed JSON response')
      } catch (parseError) {
        addPostingLog('❌ Failed to parse response JSON')
        throw new Error('Invalid response from Twitter API')
      }

      // Step 4: Handle response
      if (!response.ok) {
        addPostingLog(`❌ API request failed: ${result.error || 'Unknown error'}`)
        setLastPostResult({
          success: false,
          message: result.error || 'Failed to post to Twitter.'
        })
        toast.error(result.error || 'Failed to post to Twitter.')
        setPostingStage('Failed to post')
        return
      }

      // Step 5: Check success
      if (result.success) {
        addPostingLog('✅ Post successfully sent to Twitter!')
        if (result.tweet_id) {
          addPostingLog(`Tweet ID: ${result.tweet_id}`)
        }
        if (result.tweet_url) {
          addPostingLog(`Tweet URL: ${result.tweet_url}`)
        }
        
        setLastPostResult({
          success: true,
          message: result.message || 'Post successfully shared on Twitter!',
          tweet_url: result.tweet_url
        })
        
        setPostingStage('Successfully posted!')
        toast.success(result.message || 'Post successfully shared on Twitter!')
        
        if (result.tweet_url) {
          toast.success(`View your tweet: ${result.tweet_url}`)
        }
      } else {
        addPostingLog(`❌ Twitter API returned success=false: ${result.error || 'Unknown error'}`)
        setLastPostResult({
          success: false,
          message: result.error || 'Failed to post to Twitter.'
        })
        toast.error(result.error || 'Failed to post to Twitter.')
        setPostingStage('Failed to post')
      }
    } catch (error) {
      console.error('Error posting to Twitter:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      addPostingLog(`❌ Exception occurred: ${errorMessage}`)
      
      setLastPostResult({
        success: false,
        message: errorMessage
      })
      
      toast.error(`An error occurred: ${errorMessage}`)
      setPostingStage('Error occurred')
    } finally {
      setIsPosting(false)
      // Keep the stage for a few seconds then clear it
      setTimeout(() => {
        setPostingStage('')
      }, 3000)
    }
  }

  const onSubmit = (data: FormData) => {
    saveData(data)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">Social Post Generator</h1>
          <p className="text-slate-600">Create engaging social media content with AI</p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-6">
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
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Data
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={() => form.handleSubmit(generateAIPost)()}
                  disabled={isGenerating}
                  className="bg-slate-900 hover:bg-slate-800 text-white"
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
                    className="bg-slate-900 hover:bg-slate-800 text-white"
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
        </div>

        {/* Right Column - Outputs */}
        <div className="space-y-6">
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

          {/* Twitter Posting Status */}
          {(isPosting || postingStage || postingLogs.length > 0) && (
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                    <Twitter className="h-5 w-5 text-sky-500" />
                    Twitter Posting Status
                  </CardTitle>
                  {!isPosting && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPostingLogs([])
                        setLastPostResult(null)
                        setPostingStage('')
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-white border-slate-900"
                    >
                      Clear Logs
                    </Button>
                  )}
                </div>
                {postingStage && (
                  <CardDescription className="text-slate-600 font-medium">
                    {postingStage}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Real-time logs */}
                {postingLogs.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Process Log:</Label>
                    <div 
                      id="posting-logs"
                      className="bg-slate-50 rounded-md p-3 border border-slate-200 max-h-40 overflow-y-auto scroll-smooth"
                    >
                      {postingLogs.map((log, index) => (
                        <div key={index} className="text-sm font-mono text-slate-700 mb-1">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loading indicator */}
                {isPosting && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Processing...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Last Post Result */}
          {lastPostResult && (
            <Card className={`shadow-lg border-0 bg-white/70 backdrop-blur-sm ${
              lastPostResult.success ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'
            }`}>
              <CardHeader>
                <CardTitle className={`text-xl flex items-center gap-2 ${
                  lastPostResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {lastPostResult.success ? '✅' : '❌'}
                  {lastPostResult.success ? 'Post Success' : 'Post Failed'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-slate-700">{lastPostResult.message}</p>
                {lastPostResult.success && lastPostResult.tweet_url && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Tweet URL:</Label>
                    <a 
                      href={lastPostResult.tweet_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:text-sky-800 underline break-all text-sm"
                    >
                      {lastPostResult.tweet_url}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Saved Data Preview */}
          {savedData && (
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-slate-800">Saved Data Preview</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSavedData}
                    className="bg-slate-900 hover:bg-slate-800 text-white border-slate-900"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Saved Data
                  </Button>
                </div>
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
      </div>
    </div>
  )
}