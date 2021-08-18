import React, { useState, useEffect } from "react";
import { API, graphqlOperation } from "aws-amplify";
import { StackScreenProps } from "@react-navigation/stack";
import { GiftedChat, IMessage } from "react-native-gifted-chat";
import Observable from "zen-observable-ts";
import { AuthContextValue } from "../hooks/useAuth";
import * as mutations from "../graphql/mutations";
import * as queries from "../graphql/queries";
import * as subscriptions from "../graphql/subscriptions";
import { TabTwoParamList } from "../types";
import {
  OnCreateMessageSubscription,
  GetRoomQueryVariables,
  CreateMessageMutationVariables,
} from "../API";

type Props = StackScreenProps<TabTwoParamList, "Chat">;

type MessageSubscriptionEvent = {
  value: { data: OnCreateMessageSubscription };
};

export default function ChatScreen({ navigation, route }: Props) {
  const { roomId } = route.params;
  const [messages, setMessages] = useState<IMessage[]>([]);
  const user = AuthContextValue();

  useEffect(() => {
    fetchMessages();

    const subscription = (API.graphql(
      graphqlOperation(subscriptions.onCreateMessage)
    ) as Observable).subscribe({
      next: ({ value: { data } }) => {
        const m = data.onCreateMessage;
        const message = {
          _id: m.id || "",
          createdAt: m.createdAt || 0,
          text: m.content,
          user: { _id: m.owner, name: m.owner },
        };
        setMessages((previousMessages: IMessage[]) =>
          GiftedChat.append(previousMessages, [message as IMessage])
        );
      },
    });
    return () => subscription.unsubscribe();
  }, []);

  function fetchMessages() {
    const variables: GetRoomQueryVariables = {
      id: roomId,
    };
    (API.graphql(graphqlOperation(queries.getRoom, variables)) as Promise<
      any
    >).then((res) => {
      const messages = res.data.getRoom.messages;
      if (messages.items) {
        setMessages(
          messages.items.map((m) => ({
            _id: m.id,
            text: m.content,
            createdAt: new Date(m.when),
            user: {
              _id: m.owner,
              name: m.owner,
            },
          })) as IMessage[]
        );
      }
    });
  }

  async function onSend(messages: IMessage[]) {
    const variables: CreateMessageMutationVariables = {
      input: {
        content: messages[0].text,
        roomId: roomId,
        when: String(new Date()),
      },
    };
    await API.graphql(graphqlOperation(mutations.createMessage, variables));
  }
  return (
     onSend(messages)}
      user={{
        _id: user.username,
      }}
    />
  );
}
