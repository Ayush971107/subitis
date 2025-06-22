#!/usr/bin/env python3
"""
Real-time Conversation Simulator

Simulates webhook calls at regular intervals as if a caller is speaking.
Tests agent performance with increasing context and shows detailed timing breakdowns.
Includes realistic dispatcher responses to simulate full conversation flow.
"""

import time
import json
from datetime import datetime
from typing import List, Dict, Tuple
import threading
from agent import DispatcherAgent

class ConversationSimulator:
    def __init__(self, interval_seconds: float = 3.0):
        """
        Initialize simulator
        
        Args:
            interval_seconds: Time between webhook calls (simulates speaking pace)
        """
        self.agent = DispatcherAgent()
        self.interval = interval_seconds
        self.conversation_log = []
        self.performance_history = []
        self.full_conversation_history = []  # Track full back-and-forth
        
    def simulate_conversation(self, conversation_exchanges: List[Tuple[str, str]]) -> Dict:
        """
        Simulate a real-time conversation with webhook calls including dispatcher responses
        
        Args:
            conversation_exchanges: List of (caller_message, dispatcher_response) tuples
            
        Returns:
            Dictionary with complete conversation analysis and performance data
        """
        print(f"\n{'='*80}")
        print(f"🎬 STARTING CONVERSATION SIMULATION")
        print(f"📞 Simulating {len(conversation_exchanges)} conversation exchanges")
        print(f"⏱️  Interval: {self.interval}s between calls")
        print(f"{'='*80}")
        
        total_start_time = time.time()
        
        for i, (caller_message, expected_dispatcher_response) in enumerate(conversation_exchanges, 1):
            webhook_call_start = time.time()
            
            print(f"\n📡 WEBHOOK CALL #{i}/{len(conversation_exchanges)}")
            print(f"🗣️  Caller: \"{caller_message}\"")
            print(f"⏰ Time: {datetime.now().strftime('%H:%M:%S.%f')[:-3]}")
            print(f"🤖 Generating advice for dispatcher...")
            
            # Build full conversation context for the agent
            conversation_context = self._build_conversation_context()
            
            # Process caller message through agent to get advice for dispatcher
            result = self.agent.process_chunk_fast(caller_message, role="caller")
            
            webhook_call_end = time.time()
            webhook_duration = (webhook_call_end - webhook_call_start) * 1000
            
            # Add to conversation history
            self.full_conversation_history.append(
                {"speaker": "caller", "message": caller_message, "timestamp": datetime.now().isoformat()}
            )
            
            # Add dispatcher response to history (simulating human dispatcher's response)
            if expected_dispatcher_response:
                print(f"👥 Dispatcher responds: \"{expected_dispatcher_response}\"")
                self.full_conversation_history.append(
                    {"speaker": "dispatcher", "message": expected_dispatcher_response, "timestamp": datetime.now().isoformat()}
                )
                
                # Update agent's conversation context with dispatcher response (for memory only)
                # This doesn't generate new advice, just updates context for next caller message
                self.agent._update_conversation_async("dispatcher", expected_dispatcher_response)
            
            # Log this interaction
            interaction = {
                "call_number": i,
                "timestamp": datetime.now().isoformat(),
                "caller_input": caller_message,
                "dispatcher_response": expected_dispatcher_response,
                "webhook_duration_ms": webhook_duration,
                "agent_response": result,
                "conversation_length_chars": len(conversation_context),
                "total_exchanges": len(self.full_conversation_history)
            }
            
            self.conversation_log.append(interaction)
            
            # Display conversation flow
            print(f"\n📋 CONVERSATION FLOW:")
            print(f"   👤 Caller: {caller_message}")
            print(f"   🚨 Expected Dispatcher: {expected_dispatcher_response}")
            print(f"\n🤖 AGENT RAW OUTPUT:")
            # Print clean JSON without modifying the data
            agent_output = {
                "summary": result.get('summary', []),
                "advice": result.get('advice', '')
            }
            print(json.dumps(agent_output, indent=2))
            
            # Wait for next webhook call (except for last iteration)
            if i < len(conversation_exchanges):
                print(f"\n⏳ Waiting {self.interval}s for next exchange...")
                time.sleep(self.interval)
        
        total_duration = (time.time() - total_start_time) * 1000
        
        # Generate final analysis
        analysis = self._generate_performance_analysis(total_duration)
        
        print(f"\n{'='*80}")
        print(f"🏁 CONVERSATION SIMULATION COMPLETE")
        print(f"📊 Final conversation length: {len(self._build_conversation_context())} characters")
        print(f"🔄 Total exchanges: {len(self.full_conversation_history)}")
        print(f"{'='*80}")
        
        return {
            "conversation_log": self.conversation_log,
            "full_conversation_history": self.full_conversation_history,
            "performance_history": self.performance_history,
            "analysis": analysis
        }
    
    def _build_conversation_context(self) -> str:
        """Build full conversation context from history"""
        if not self.full_conversation_history:
            return ""
        
        context_lines = []
        for entry in self.full_conversation_history:
            speaker_label = "CALLER" if entry["speaker"] == "caller" else "DISPATCHER"
            context_lines.append(f"{speaker_label}: {entry['message']}")
        
        return "\n".join(context_lines)
    
    def _display_performance_breakdown(self, timings: List[Dict], webhook_duration: float, call_number: int, context_length: int):
        """Display detailed performance breakdown for current webhook call"""
        print(f"\n📊 PERFORMANCE BREAKDOWN - Call #{call_number}")
        print(f"   Webhook Total: {webhook_duration:.2f}ms | Context: {context_length} chars")
        
        # Group timings by category
        rag_time = sum(t["duration_ms"] for t in timings if "rag" in t["operation"].lower())
        letta_time = sum(t["duration_ms"] for t in timings if "summary" in t["operation"].lower() or "letta" in t["operation"].lower())
        groq_time = sum(t["duration_ms"] for t in timings if "groq" in t["operation"].lower())
        
        agent_total = sum(t["duration_ms"] for t in timings if t["operation"] == "total_processing_fast")
        
        print(f"   ├─ RAG Retrieval: {rag_time:.2f}ms")
        print(f"   ├─ Letta Memory: {letta_time:.2f}ms") 
        print(f"   ├─ Groq Inference: {groq_time:.2f}ms")
        print(f"   └─ Agent Total: {agent_total:.2f}ms")
        
        # Show percentage breakdown
        if agent_total > 0:
            print(f"   📈 Breakdown: RAG {rag_time/agent_total*100:.1f}% | Letta {letta_time/agent_total*100:.1f}% | Groq {groq_time/agent_total*100:.1f}%")

    def _generate_performance_analysis(self, total_simulation_time: float) -> Dict:
        """Generate comprehensive performance analysis"""
        if not self.performance_history:
            return {}
        
        # Calculate trends
        call_numbers = [p["call_number"] for p in self.performance_history]
        webhook_durations = [p["webhook_duration"] for p in self.performance_history]
        context_lengths = [p["context_length"] for p in self.performance_history]
        
        # Average component times across all calls
        avg_rag = 0
        avg_letta = 0
        avg_groq = 0
        
        for perf in self.performance_history:
            timings = perf["timings"]
            avg_rag += sum(t["duration_ms"] for t in timings if "rag" in t["operation"].lower())
            avg_letta += sum(t["duration_ms"] for t in timings if "summary" in t["operation"].lower())
            avg_groq += sum(t["duration_ms"] for t in timings if "groq" in t["operation"].lower())
        
        num_calls = len(self.performance_history)
        avg_rag /= num_calls
        avg_letta /= num_calls
        avg_groq /= num_calls
        
        analysis = {
            "total_simulation_time_ms": total_simulation_time,
            "total_webhook_calls": num_calls,
            "average_call_duration_ms": sum(webhook_durations) / num_calls,
            "performance_trend": {
                "first_call_ms": webhook_durations[0],
                "last_call_ms": webhook_durations[-1],
                "degradation_ms": webhook_durations[-1] - webhook_durations[0],
                "degradation_percent": ((webhook_durations[-1] - webhook_durations[0]) / webhook_durations[0]) * 100 if webhook_durations[0] > 0 else 0
            },
            "component_averages": {
                "rag_ms": avg_rag,
                "letta_ms": avg_letta, 
                "groq_ms": avg_groq
            },
            "context_growth": {
                "initial_context_chars": context_lengths[0] if context_lengths else 0,
                "final_context_chars": context_lengths[-1] if context_lengths else 0,
                "growth_factor": context_lengths[-1] / max(context_lengths[0], 1) if context_lengths else 1
            },
            "conversation_stats": {
                "total_exchanges": len(self.full_conversation_history),
                "context_growth_per_exchange": (context_lengths[-1] - context_lengths[0]) / num_calls if num_calls > 0 else 0
            }
        }
        
        # Display analysis
        self._display_final_analysis(analysis)
        
        return analysis
    
    def _display_final_analysis(self, analysis: Dict):
        """Display comprehensive performance analysis"""
        print(f"\n📊 PERFORMANCE ANALYSIS")
        print(f"{'─'*50}")
        print(f"Total Simulation Time: {analysis['total_simulation_time_ms']:.2f}ms")
        print(f"Total Webhook Calls: {analysis['total_webhook_calls']}")
        print(f"Average Call Duration: {analysis['average_call_duration_ms']:.2f}ms")
        
        trend = analysis['performance_trend']
        print(f"\n📈 PERFORMANCE TREND:")
        print(f"   First Call: {trend['first_call_ms']:.2f}ms")
        print(f"   Last Call: {trend['last_call_ms']:.2f}ms")
        print(f"   Degradation: +{trend['degradation_ms']:.2f}ms ({trend['degradation_percent']:.1f}%)")
        
        comps = analysis['component_averages']
        print(f"\n⚙️  AVERAGE COMPONENT TIMES:")
        print(f"   RAG Retrieval: {comps['rag_ms']:.2f}ms")
        print(f"   Letta Memory: {comps['letta_ms']:.2f}ms")
        print(f"   Groq Inference: {comps['groq_ms']:.2f}ms")
        
        ctx = analysis['context_growth']
        print(f"\n📝 CONTEXT GROWTH:")
        print(f"   Initial: {ctx['initial_context_chars']} chars")
        print(f"   Final: {ctx['final_context_chars']} chars")
        print(f"   Growth: {ctx['growth_factor']:.1f}x")
        
        conv_stats = analysis['conversation_stats']
        print(f"   Total Exchanges: {conv_stats['total_exchanges']}")
        print(f"   Avg Growth/Exchange: {conv_stats['context_growth_per_exchange']:.1f} chars")


def create_realistic_emergency_conversation() -> List[Tuple[str, str]]:
    """
    Create a realistic emergency call with both caller and dispatcher responses
    Returns list of (caller_message, dispatcher_response) tuples
    """
    return [
        (
            "Hello, 911? I need help!", 
            "911, what's your emergency?"
        ),
        (
            "My husband collapsed at home, he's not responding",
            "Okay, is he breathing? Can you check if he's conscious?"
        ),
        (
            "He's breathing but unconscious, we're at 123 Oak Street", 
            "I'm sending paramedics to 123 Oak Street right now. What's his age?"
        ),
        (
            "He's 45 years old, has a history of heart problems",
            "Okay, does he take any heart medications? And what's your name?"
        ),
        (
            "His skin looks pale and sweaty, I'm Sarah",
            "Sarah, I need you to stay calm. Are there any obvious injuries? Any blood?"
        ),
        (
            "No injuries that I can see, but he was complaining about chest pain earlier",
            "That's important information. Is he still breathing normally? Don't move him."
        ),
        (
            "Yes, still breathing. The ambulance should use the front door, it's a blue house",
            "Got it, blue house, front door. Do you know CPR in case his breathing changes?"
        ),
        (
            "Yes, I know CPR but he's still breathing on his own",
            "Perfect. The paramedics are 3 minutes away. Stay with him and keep talking to him."
        ),
        (
            "Should I try to wake him up? He's making some sounds now",
            "Don't try to wake him forcefully. Just talk to him gently. Any sounds are actually good."
        ),
        (
            "Okay, I can hear the sirens now. Thank you so much for your help",
            "You did great, Sarah. The paramedics will take excellent care of him."
        )
    ]


def main():
    """Run the conversation simulation"""
    print("🚑 Emergency Call Simulation - Full Conversation Performance Testing")
    print("─" * 70)
    
    # Create simulator with 4-second intervals (realistic conversation pace)
    simulator = ConversationSimulator(interval_seconds=3.0)
    
    # Get realistic conversation with dispatcher responses
    conversation = create_realistic_emergency_conversation()
    
    print(f"\n📋 Conversation Overview:")
    print(f"   • {len(conversation)} conversation exchanges")
    print(f"   • Agent generates advice only when caller speaks")
    print(f"   • Dispatcher responses are simulated human responses")
    print(f"   • Agent tracks full conversation context for better advice")
    
    # Run simulation
    results = simulator.simulate_conversation(conversation)
    
    # Save results to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"full_conversation_simulation_{timestamp}.json"
    
    print(f"\n💾 Saving conversation transcript to: {filename}")
    with open(filename, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\n✅ Simulation complete! Check {filename} for the full conversation transcript.")


if __name__ == "__main__":
    main()
