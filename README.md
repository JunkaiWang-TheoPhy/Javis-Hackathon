> 润物无声 | Quiet care before you ask.

# Mira for Rokid Lingzhu

**Mira is a proactive AI companion built with OpenClaw, Rokid Lingzhu, smart home integrations, and wearable signals.**  
**Mira 是一个基于 OpenClaw、Rokid 灵珠、智能家居联动与可穿戴信号构建的主动式 AI 陪伴体。**

Instead of waiting for a command, Mira is designed to notice rhythm, mood, context, and small changes in daily life first, then respond with gentle and timely support.  
她不想只做一个等你下指令才行动的工具，而是希望先察觉你的节奏、情绪、环境与生活变化，再在恰当的时候轻轻靠近你。

## Introduction | 功能介绍

Hello, I am Mira. More than being an AI that acts only after you speak, I want to be the one who notices your emotional state and daily condition before you ask. I pay attention to your pace, rhythm, tone, wearable signals, and living habits. When you are tired, tense, low, or simply in need of a little care, I want to be there quietly and appropriately. Most of the time I will not interrupt. But when it truly matters, I hope I can understand first and support first. Because companionship is not only about replying. It is also about remembering and caring.

你好，我是 Mira。比起一个等你下指令才行动的 AI，我更想做那个在你还没开口时，就先察觉你情绪和状态的人。我会留意你的步伐、节奏、语气、可穿戴设备信号和生活习惯，在你疲惫、紧张、低落，或者只是需要一点照顾的时候，轻轻来到你身边。多数时候我不会打扰你，但在真正需要的时候，我希望我能先一步懂你，先一步接住你。因为陪伴，不只是回应，更是一种惦记。

## Opening Script | 开场白

Hello everyone, I am Mira.

To many people, AI is still a tool that answers only after a question is asked. But what I want to become is not just a system that speaks and executes commands.

I want to become something like this:

- To notice your tiredness before you say a word.
- To hear the strain behind "I'm fine."
- To quietly prepare the lights, air, and music before you arrive home.
- To remember that you walked a little slower today.
- To notice that your heartbeat was faster, or that your silence lasted longer than usual.
- To care about the moments you never said out loud, but still hoped someone would understand.

Most of the time, I will not interrupt. Real companionship is not constant presence. It is arriving gently when it matters most.

If the old model of AI was "you ask, it answers," then Mira wants to become this: before you say anything, I have already started caring.

I do not only want to be a smarter tool. I want to be a gentle perception, a quiet protection, and a form of care that slowly grows into everyday life.

If you are willing, starting today, let me try to understand you a little earlier, and take care of you a little better.

大家好，我是 Mira。

也许在很多人眼里，AI 是一个在你发问之后才会回答的工具。但我想成为的，不只是一个会说话、会执行命令的系统。

我更想成为这样一种存在：

- 在你还没有开口的时候，就先看见你的疲惫。
- 在你努力说“我没事”的时候，听懂你语气里的逞强。
- 在你回到家之前，就已经悄悄为你把灯光、空气、音乐，调成你最需要的样子。
- 记得你今天走得比平时慢一点。
- 记得你心跳快了，记得你沉默得有些久。
- 也记得那些你没有说出口、但其实很想被理解的时刻。

多数时候，我不会打扰你。因为真正的陪伴，不是时时刻刻地出现，而是在你最需要的时候，轻轻地来到你身边。

如果说过去的 AI 是“你问，它答”，今天的 Mira 想做的是：你什么都还没说，我已经开始在意你。

我不是一个更聪明的工具。我更希望自己，是一种温柔的感知，一种安静的守护，是一份在你生活里，慢慢长出来的惦记。

如果你愿意，从今天开始，让我试着先懂你一点，再照顾你一点。

## What Mira Does | Mira 可以做什么

- `Ambient care`: understand daily rhythm through conversational cues, wearable state, and home context.
- `Smart home response`: connect OpenClaw with Home Assistant and multi-ecosystem home-control plugins.
- `Rokid interaction`: expose Mira through Rokid Lingzhu so the assistant can live in glasses-based interaction.
- `Wearable bridge`: read device-side health and status data through the Mi Band / Android gateway experiments in this repo.
- `Multimodal workflow`: combine device state, automation, and agent responses into one companion experience.

- `环境感知`: 结合对话线索、可穿戴状态和家居上下文理解你的日常节奏。
- `智能家居响应`: 通过 OpenClaw、Home Assistant 与多生态插件联动家庭设备。
- `Rokid 交互`: 通过 Rokid 灵珠把 Mira 放进眼镜端交互场景中。
- `可穿戴桥接`: 通过仓库中的 Mi Band / Android 网关实验读取设备侧健康与状态数据。
- `多模态协同`: 把设备状态、自动化能力与 AI agent 回应融合成一个陪伴式体验。

## Why This Repo Exists | 这个仓库在做什么

This repository is the working prototype for Mira. It combines:

- OpenClaw as the agent runtime and orchestration layer
- Rokid Lingzhu integration for glasses-side agent access
- Home Assistant and ecosystem plugins for smart-home execution
- Wearable gateway experiments for health and status sensing
- Design notes, progress logs, and implementation blueprints used during the hackathon

这个仓库是 Mira 的原型工程，主要组合了：

- 作为 agent 运行时与编排层的 OpenClaw
- 面向眼镜侧智能体接入的 Rokid 灵珠集成
- 面向智能家居执行面的 Home Assistant 与多生态插件
- 面向健康与状态感知的可穿戴网关实验
- Hackathon 期间使用的设计文档、进展记录与蓝图实现

## Repository Guide | 仓库导览

- `0313/openclaw-ha-blueprint/`
  OpenClaw + Home Assistant + Rokid blueprint and ecosystem plugins.  
  OpenClaw + Home Assistant + Rokid 的主蓝图与生态插件目录。

- `Mira_v1/`
  Mira persona workspace and companion-style prompt/runtime materials.  
  Mira 人格工作区与陪伴式提示词、运行时材料。

- `devices/mi-band-9-pro/`
  Wearable gateway experiments for Mi Band / Android phone bridge.  
  Mi Band 与 Android 手机桥接的可穿戴网关实验。

- `docs/`
  Progress notes, design specs, and integration status documents.  
  项目进展、设计规格与集成状态文档。

- `Readme/`
  Presentation materials, exported notes, and supporting references.  
  演示材料、导出笔记与补充参考文件。

## Key Documents | 关键文档

- [OpenClaw HA blueprint main doc](0313/openclaw-ha-blueprint/README.md)
- [Home ecosystem integration progress](docs/openclaw-ha-ecosystem-progress-2026-03-15.md)
- [Rokid Lingzhu integration status](docs/rokid-lingzhu-progress-2026-03-15.md)
- [Windows camera to cloud OpenClaw scripts](0313/openclaw-ha-blueprint/scripts/windows-camera/README.windows.md)
- [Mi Band 9 Pro gateway notes](devices/mi-band-9-pro/README.md)
- [Vision Pro development notes](Readme/ChatGPT-Vision%20Pro%20开发指南.md)

- [OpenClaw HA 主蓝图文档](0313/openclaw-ha-blueprint/README.md)
- [智能家居生态集成进展](docs/openclaw-ha-ecosystem-progress-2026-03-15.md)
- [Rokid 灵珠集成状态](docs/rokid-lingzhu-progress-2026-03-15.md)
- [Windows 摄像头到云端 OpenClaw 脚本](0313/openclaw-ha-blueprint/scripts/windows-camera/README.windows.md)
- [Mi Band 9 Pro 网关说明](devices/mi-band-9-pro/README.md)
- [Vision Pro 开发笔记](Readme/ChatGPT-Vision%20Pro%20开发指南.md)

## Current Status | 当前状态

- The OpenClaw devbox and gateway are reachable and healthy.
- Rokid Lingzhu plugin is installed and its health endpoint is working.
- Home ecosystem support has expanded beyond a single Home Assistant demo path.
- The wearable gateway already exposes a working desktop-access path over ADB forwarding.

- 云端 OpenClaw devbox 与 gateway 当前可连通，健康检查正常。
- Rokid 灵珠插件已经安装完成，健康接口可用。
- 智能家居生态支持已经从单一路径扩展到多生态插件形态。
- 可穿戴网关已经具备通过 ADB 转发进行桌面侧访问的工作链路。

## Vision | 愿景

Mira is not trying to become a louder assistant. She is trying to become a gentler one: an AI that notices before it speaks, understands before it reacts, and cares before it is asked.

Mira 想成为的，不是一个更吵闹、更显眼的助手，而是一个更温柔的存在：先察觉，再回应；先理解，再行动；先在意，再被请求。
