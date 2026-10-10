import {useEffect,useState,type FormEvent} from 'react'
import {addComment,loadComments} from './database'
export default function PostComments({id}:{id:string}){
 const [comments,setComments]=useState<any[]>([]),[author,setAuthor]=useState(''),[text,setText]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 useEffect(()=>{void loadComments(id).then(setComments).catch(e=>setError(e.message))},[id])
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{await addComment(id,author,text);setComments(await loadComments(id));setText('')}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <section><h2>Comments</h2>{error&&<p role="alert">{error}</p>}{comments.map(c=><p key={c.id}><strong>{c.author}</strong>: {c.text}</p>)}<form className="stack-form" onSubmit={submit}><label htmlFor="comment-name">Your name</label><input id="comment-name" required maxLength={40} value={author} onChange={e=>setAuthor(e.target.value)}/><label htmlFor="comment-text">Comment</label><textarea id="comment-text" required maxLength={500} value={text} onChange={e=>setText(e.target.value)}/><button disabled={busy} className="button secondary">{busy?'Sending…':'Add comment'}</button></form></section>
}
