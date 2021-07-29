import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import TextField from "@material-ui/core/TextField"
import AssignmentIcon from "@material-ui/icons/Assignment"
import { Col, notification, Row } from "antd";
import PhoneIcon from "@material-ui/icons/Phone"
import PhoneInTalkIcon from '@material-ui/icons/PhoneInTalk';
import PhoneDisabledIcon from '@material-ui/icons/PhoneDisabled';
import PhoneDisabledTwoToneIcon from '@material-ui/icons/PhoneDisabledTwoTone';
import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';
import ScreenShareIcon from '@material-ui/icons/ScreenShare';
import React, { useEffect, useRef, useState } from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"
import VideocamIcon from '@material-ui/icons/Videocam';
import VideocamOffIcon from '@material-ui/icons/VideocamOff';
import io from "socket.io-client"
import alertify from "alertifyjs";
import "./App.css"


const socket = io.connect('http://localhost:5000')
function App() {
	const [ me, setMe ] = useState("")
	const [ stream, setStream ] = useState()
	const [ receivingCall, setReceivingCall ] = useState(false)
	const [ caller, setCaller ] = useState("")
	const [ callerSignal, setCallerSignal ] = useState()
	const [ callAccepted, setCallAccepted ] = useState(false)
	const [callRejected, setCallRejected] = useState(false)
	const [isMuted, setisMuted] = useState(false)
	const [isCameraOn, setisCameraOn] = useState(false)
	const [ idToCall, setIdToCall ] = useState("")
	const [ callEnded, setCallEnded] = useState(false)
	const [ name, setName ] = useState("")
	const myVideo = useRef()
	const userVideo = useRef()
	const connectionRef= useRef()

	const idOfGuest = idToCall



	useEffect(() => {
		navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
			setStream(stream)
				myVideo.current.srcObject = stream
		})

	socket.on("me", (id) => {
			setMe(id)
		})

		socket.on("callUser", (data) => {
			setReceivingCall(true)
			setCaller(data.from)
			setName(data.name)
			setCallerSignal(data.signal)
		})
	}, [])

	const callUser = (id) => {
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("callUser", {
				userToCall: id,
				signalData: data,
				from: me,
				name: name
			})
		})
		peer.on("stream", (stream) => {
			
				userVideo.current.srcObject = stream
			
		})
		socket.on("callAccepted", (signal) => {
			setCallAccepted(true)
			peer.signal(signal)
		})

		connectionRef.current = peer
	}

	const answerCall =() =>  {
		setCallAccepted(true)
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("answerCall", { signal: data, to: caller })
		})
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream
		})

		peer.signal(callerSignal)
		connectionRef.current = peer
	}

	const leaveCall = () => {
		setCallEnded(true)
		connectionRef.current.destroy()
	}

	const handleRejected =() => {
		connectionRef.current.destroy()
	}


	// const alertCallEnded = ()=> {
	// 	notification.success({
	// 		description: "Call Ended!",
	// 		duration: 2,
	// 		placement: "bottomLeft"
	// 	})
	// }

	// const alertCallEnded = ()=> {
	// 	alertify.confirm("Call Ended!");
	// }
	return (
		<>
			<h1 style={{ textAlign: "center", color: '#fff' }}>3D Studyo Call Center</h1>
		<div className="container">
			<div className="video-container">
			<div className="video">
					{callAccepted && !callEnded ?
					<video playsInline ref={userVideo} autoPlay style={{ width: "700px", alignSelf: "center",  marginBottom: "40px"}} />:
					null}

					{callAccepted ? <div className="panelbar" >
						 

						<Row gutter={24}>
							
								{isMuted ? <MicIcon color="white" fontSize="large" onClick={()=> setisMuted(false)} /> : 
							<MicOffIcon fontSize="large" onClick={()=> setisMuted(true)}/> }
							<ScreenShareIcon fontSize="large"/>
							{isCameraOn ? <VideocamIcon fontSize="large" onClick={()=>setisCameraOn(false)}/> : 
							<VideocamOffIcon fontSize="large" onClick={()=> setisCameraOn(true)} /> }
							<Button variant="contained" color="secondary" onClick={()=> {setCallEnded(true)
							leaveCall()
							}} startIcon={<PhoneDisabledIcon fontSize="large"/>}></Button>


						</Row>
						

					</div>: null}
				</div>
				<div className="video">
					{stream &&  <video playsInline muted={isMuted} ref={myVideo} autoPlay style={{ width: !callAccepted ? "500px"  :  "200px", position: !callAccepted ? "absolute" : "fixed", bottom: !callAccepted ? 150 :  0, right: !callAccepted ? 450 : 0 }} />}
				</div>
				
			</div>
			<div className="myId">
				<TextField
					id="filled-basic"
					label="Name"
					variant="filled"
					value={name}
					onChange={(e) => setName(e.target.value)}
					style={{ marginBottom: "20px" }}
				/>
				<CopyToClipboard text={me} style={{ marginBottom: "2rem" }}>
					<Button variant= "contained" style={{color: "green"}} color="primary" startIcon={<AssignmentIcon fontSize="large" />}>
						Copy ID
					</Button>
				</CopyToClipboard>

				<TextField
					id="filled-basic"
					label="ID to call"
					variant="filled"
					value={idToCall}
					onChange={(e) => setIdToCall(e.target.value)}
				/>
				<div className="call-button">
					{callAccepted && !callEnded ? (
						<Button variant="contained" color="secondary" onClick={()=> {
							
							leaveCall()
							// alertCallEnded()

							}}>
							End Call
						</Button>
					) : (
						<IconButton color="primary" aria-label="call" onClick={() => callUser(idToCall)}>
							<PhoneIcon fontSize="large" />
						</IconButton>
					)}
					<br/>
					Now connecting with {"->"} <br/>
					{idOfGuest}
				</div>
			</div>
			
			
			<div>
				{receivingCall && !callAccepted ? (
						<div style={{textAlign: "center", color: "#fff", position: "fixed", bottom: 25, left: 500}}>
						<h1 >{name} is calling...</h1>
						<Button variant="contained" color="primary" startIcon={<PhoneInTalkIcon fontSize="large"/>} 
						onClick={answerCall}>
							Answer
						</Button>
						<Button variant="contained" color="secondary" startIcon={<PhoneDisabledIcon fontSize="large"/>} 
						
						>
							Decline
						</Button>
						
					</div>
				) : null}
			</div>
		
		
		
		
		
			
		</div>
		</>
	)
}

export default App
